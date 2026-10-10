import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/dynamic_theme.dart';
import '../../core/formatters.dart';
import '../../core/routes.dart';
import '../../core/translation_manager.dart';
import '../../models/order.dart';
import '../../providers/config_provider.dart';
import '../../providers/order_provider.dart';
import '../../services/payment_service.dart';
import '../../widgets/common/cards.dart';
import '../../widgets/common/states.dart';
import '../../widgets/common/status_chip.dart';

const trackingSteps = ['placed', 'accepted', 'preparing', 'ready', 'picked', 'delivered'];

/// Timeline + live map (when `liveTracking` is enabled) + call buttons.
class OrderTrackingScreen extends ConsumerWidget {
  final String orderId;
  const OrderTrackingScreen({super.key, required this.orderId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(orderTrackerProvider(orderId));
    final cfg = ref.watch(appConfigProvider);
    final o = state.order;
    if (o == null) {
      return Scaffold(
          appBar: AppBar(),
          body: state.error != null
              ? ErrorView(error: state.error!, onRetry: () => ref.read(orderTrackerProvider(orderId).notifier).refresh())
              : const LoadingView());
    }
    final showMap = cfg.feature('liveTracking') && o.isActive && o.dropLat != null;
    return Scaffold(
      appBar: AppBar(
          title: Text(tr('order.number', {'number': o.orderNumber})),
          actions: [Padding(padding: const EdgeInsets.only(right: 12), child: Center(child: StatusChip(o.status)))]),
      body: RefreshIndicator(
        onRefresh: () => ref.read(orderTrackerProvider(orderId).notifier).refresh(),
        child: ListView(padding: const EdgeInsets.all(16), children: [
          if (showMap) ...[
            SizedBox(
                height: 240,
                child: ClipRRect(
                    borderRadius: BorderRadius.circular(AppColors.of(context).cardRadius),
                    child: _TrackingMap(order: o, riderLat: state.riderLat, riderLng: state.riderLng))),
            const SizedBox(height: 12)
          ],
          if (o.paymentStatus == 'pending' && o.paymentMethod != 'cod' && o.isActive)
            Card(
              color: Theme.of(context).colorScheme.errorContainer,
              child: ListTile(
                title: Text(tr('payment.pending')),
                trailing: FilledButton(
                  onPressed: () async {
                    final ok = await PaymentService().payForOrder(o.id);
                    if (context.mounted) showMessage(context, ok ? 'payment.success' : 'payment.failed');
                    ref.read(orderTrackerProvider(orderId).notifier).refresh();
                  },
                  child: Text(tr('payment.payNow')),
                ),
              ),
            ),
          if (o.estimatedDeliveryAt != null && o.isActive)
            AppCard(
                child: Row(children: [
              const Icon(Icons.schedule),
              const SizedBox(width: 10),
              Text(tr('order.eta', {'time': Fmt.time(o.estimatedDeliveryAt)}))
            ])),
          if (o.deliveryOtp.isNotEmpty && o.isActive) ...[
            const SizedBox(height: 10),
            AppCard(
                child: Row(children: [
              const Icon(Icons.password),
              const SizedBox(width: 10),
              Expanded(child: Text(tr('order.deliveryOtp', {'otp': o.deliveryOtp})))
            ])),
          ],
          const SizedBox(height: 12),
          AppCard(child: _Timeline(order: o)),
          const SizedBox(height: 12),
          AppCard(
            padding: EdgeInsets.zero,
            child: Column(children: [
              ListTile(
                leading: ClipOval(child: NetImage(o.restaurant.logo, width: 40, height: 40)),
                title: Text(o.restaurant.name),
                subtitle: Text(o.restaurant.address, maxLines: 1, overflow: TextOverflow.ellipsis),
                trailing: o.restaurant.phone.isNotEmpty && cfg.feature('chatWithVendor')
                    ? IconButton(icon: const Icon(Icons.call), onPressed: () => launchUrl(Uri.parse('tel:${o.restaurant.phone}')))
                    : null,
              ),
              if (o.deliveryPartner != null)
                ListTile(
                  leading: ClipOval(child: NetImage(o.deliveryPartner!.avatar, width: 40, height: 40, placeholderIcon: Icons.delivery_dining)),
                  title: Text(o.deliveryPartner!.name),
                  subtitle: Text(tr('order.yourRider')),
                  trailing: o.deliveryPartner!.phone.isNotEmpty
                      ? IconButton(icon: const Icon(Icons.call), onPressed: () => launchUrl(Uri.parse('tel:${o.deliveryPartner!.phone}')))
                      : null,
                ),
            ]),
          ),
          const SizedBox(height: 12),
          AppCard(child: OrderSummary(order: o)),
          const SizedBox(height: 12),
          if (o.canCancel)
            OutlinedButton(
              style: OutlinedButton.styleFrom(foregroundColor: Theme.of(context).colorScheme.error),
              onPressed: () async {
                final reason = await promptDialog(context, titleKey: 'order.cancelTitle', labelKey: 'order.cancelReason');
                if (reason == null) return;
                try {
                  await ref.read(orderTrackerProvider(orderId).notifier).cancel(reason);
                  if (context.mounted) showMessage(context, 'order.cancelled');
                } catch (e) {
                  if (context.mounted) showError(context, e);
                }
              },
              child: Text(tr('order.cancel')),
            ),
          if (o.status == 'delivered' && !o.isRated && cfg.feature('reviews'))
            FilledButton.icon(
                onPressed: () => Navigator.pushNamed(context, Routes.review, arguments: o.id),
                icon: const Icon(Icons.star_outline),
                label: Text(tr('order.rate'))),
        ]),
      ),
    );
  }
}

class _Timeline extends StatelessWidget {
  final Order order;
  const _Timeline({required this.order});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    if (order.status == 'cancelled' || order.status == 'rejected') {
      return ListTile(
        leading: Icon(Icons.cancel, color: scheme.error),
        title: Text(tr('status.${order.status}')),
        subtitle: order.cancelReason.isNotEmpty ? Text(order.cancelReason) : null,
      );
    }
    final current = trackingSteps.indexOf(order.status);
    return Column(
      children: List.generate(trackingSteps.length, (i) {
        final done = i <= current;
        final ev = order.history.where((h) => h.status == trackingSteps[i]).firstOrNull;
        return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Column(children: [
            Icon(done ? Icons.check_circle : Icons.radio_button_unchecked, color: done ? scheme.primary : scheme.outline),
            if (i < trackingSteps.length - 1) Container(width: 2, height: 28, color: i < current ? scheme.primary : scheme.outlineVariant),
          ]),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(tr('status.${trackingSteps[i]}'), style: TextStyle(fontWeight: done ? FontWeight.w700 : FontWeight.normal)),
                if (ev?.at != null) Text(Fmt.time(ev!.at), style: Theme.of(context).textTheme.bodySmall),
              ]),
            ),
          ),
        ]);
      }),
    );
  }
}

class _TrackingMap extends StatefulWidget {
  final Order order;
  final double? riderLat;
  final double? riderLng;
  const _TrackingMap({required this.order, this.riderLat, this.riderLng});
  @override
  State<_TrackingMap> createState() => _TrackingMapState();
}

class _TrackingMapState extends State<_TrackingMap> {
  GoogleMapController? _map;

  @override
  void didUpdateWidget(covariant _TrackingMap old) {
    super.didUpdateWidget(old);
    if (widget.riderLat != null && (widget.riderLat != old.riderLat || widget.riderLng != old.riderLng)) {
      _map?.animateCamera(CameraUpdate.newLatLng(LatLng(widget.riderLat!, widget.riderLng!)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final o = widget.order;
    final drop = LatLng(o.dropLat!, o.dropLng!);
    final markers = <Marker>{
      Marker(markerId: const MarkerId('drop'), position: drop, infoWindow: InfoWindow(title: tr('order.you'))),
      if (o.restaurant.lat != null)
        Marker(
            markerId: const MarkerId('restaurant'), position: LatLng(o.restaurant.lat!, o.restaurant.lng!), infoWindow: InfoWindow(title: o.restaurant.name)),
      if (widget.riderLat != null)
        Marker(
          markerId: const MarkerId('rider'),
          position: LatLng(widget.riderLat!, widget.riderLng!),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
          infoWindow: InfoWindow(title: tr('order.yourRider')),
        ),
    };
    return GoogleMap(
      initialCameraPosition: CameraPosition(target: drop, zoom: 14),
      markers: markers,
      myLocationButtonEnabled: false,
      zoomControlsEnabled: false,
      onMapCreated: (c) => _map = c,
    );
  }
}

class OrderSummary extends StatelessWidget {
  final Order order;
  const OrderSummary({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    final b = order.bill;
    Widget row(String k, double v, {bool bold = false, bool neg = false, Map<String, Object?> vars = const {}}) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 2),
          child: Row(children: [
            Expanded(child: Text(tr(k, vars), style: bold ? const TextStyle(fontWeight: FontWeight.w800) : null)),
            Text('${neg ? '-' : ''}${Fmt.money(v)}', style: bold ? const TextStyle(fontWeight: FontWeight.w800) : null),
          ]),
        );
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(tr('order.items'), style: const TextStyle(fontWeight: FontWeight.w700)),
      const SizedBox(height: 6),
      for (final i in order.items)
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 3),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            VegBadge(isVeg: i.isVeg, size: 14),
            const SizedBox(width: 8),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(tr('order.itemQty', {'qty': i.quantity, 'name': i.name})),
                if (i.addOns.isNotEmpty) Text(i.addOns.join(', '), style: Theme.of(context).textTheme.bodySmall),
              ]),
            ),
            Text(Fmt.money(i.lineTotal)),
          ]),
        ),
      const Divider(),
      row('cart.itemTotal', b.subtotal),
      if (b.discount > 0) row('cart.discount', b.discount, neg: true),
      row('cart.deliveryFee', b.deliveryFee, vars: {'km': order.distanceKm.toStringAsFixed(1)}),
      if (b.surgeFee > 0) row('cart.surgeFee', b.surgeFee, vars: {'reason': ''}),
      if (b.packagingFee > 0) row('cart.packagingFee', b.packagingFee),
      if (b.platformFee > 0) row('cart.platformFee', b.platformFee),
      if (b.tax > 0) row('cart.taxShort', b.tax),
      if (b.tip > 0) row('cart.tip', b.tip),
      if (b.walletUsed > 0) row('cart.walletUsed', b.walletUsed, neg: true),
      const Divider(),
      row('cart.total', b.total, bold: true),
      const SizedBox(height: 6),
      Text(tr('order.paidVia', {'method': tr('payment.method.${order.paymentMethod}'), 'status': tr('payment.status.${order.paymentStatus}')}),
          style: Theme.of(context).textTheme.bodySmall),
    ]);
  }
}
