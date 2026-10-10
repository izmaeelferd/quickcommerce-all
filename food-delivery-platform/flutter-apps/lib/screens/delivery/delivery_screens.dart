import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/dynamic_theme.dart';
import '../../core/formatters.dart';
import '../../core/routes.dart';
import '../../core/translation_manager.dart';
import '../../models/json_utils.dart';
import '../../models/order.dart';
import '../../providers/auth_provider.dart';
import '../../providers/config_provider.dart';
import '../../services/api_service.dart';
import '../../services/location_service.dart';
import '../../services/socket_service.dart';
import '../../widgets/common/buttons.dart';
import '../../widgets/common/cards.dart';
import '../../widgets/common/map_or_fallback.dart';
import '../../widgets/common/inputs.dart';
import '../../widgets/common/states.dart';
import '../../widgets/common/status_chip.dart';

final availableOrdersProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final data = await ApiService.instance.availableOrders();
  return toList(data['items']).map((e) => toMap(e)).toList();
});

final activeDeliveryProvider = FutureProvider.autoDispose<Order?>((ref) async {
  final sub = SocketService.instance.on('order:status-update').listen((_) => ref.invalidateSelf());
  ref.onDispose(sub.cancel);
  final d = await ApiService.instance.activeDelivery();
  return d == null ? null : Order.fromJson(d);
});

Future<void> openNavigation(double lat, double lng) async {
  final uri = Uri.parse('https://www.google.com/maps/dir/?api=1&destination=$lat,$lng&travelmode=driving');
  await launchUrl(uri, mode: LaunchMode.externalApplication);
}

class DeliveryHomeTab extends ConsumerWidget {
  const DeliveryHomeTab({super.key});

  Future<void> _toggle(BuildContext context, WidgetRef ref, bool online) async {
    try {
      final p = await LocationService.instance.current();
      final dp = await ApiService.instance.setOnline(online, lat: p?.latitude, lng: p?.longitude);
      ref.read(authProvider.notifier).updateDeliveryProfile(dp);
      SocketService.instance.setDeliveryOnline(online);
      ref.invalidate(availableOrdersProvider);
    } catch (e) {
      if (context.mounted) showError(context, e);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final approved = auth.deliveryStatus == 'approved';
    final online = auth.deliveryOnline;
    final active = ref.watch(activeDeliveryProvider);
    final scheme = Theme.of(context).colorScheme;
    final colors = AppColors.of(context);
    return SafeArea(
      child: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(availableOrdersProvider);
          ref.invalidate(activeDeliveryProvider);
          await ref.read(authProvider.notifier).refresh();
        },
        child: ListView(padding: const EdgeInsets.all(16), children: [
          Text(tr('delivery.hello', {'name': auth.user?.name ?? ''}), style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 12),
          if (!approved)
            Card(
                color: scheme.errorContainer,
                child: ListTile(
                    leading: const Icon(Icons.hourglass_top),
                    title: Text(tr('delivery.status.${auth.deliveryStatus}')),
                    subtitle: Text(tr('delivery.pendingHint'))))
          else
            Container(
              decoration:
                  BoxDecoration(color: online ? colors.success : scheme.surfaceContainerHighest, borderRadius: BorderRadius.circular(colors.cardRadius)),
              child: SwitchListTile(
                title: Text(tr(online ? 'delivery.youAreOnline' : 'delivery.youAreOffline'),
                    style: TextStyle(color: online ? scheme.onPrimary : null, fontWeight: FontWeight.w700)),
                subtitle: Text(tr(online ? 'delivery.onlineHint' : 'delivery.offlineHint'), style: TextStyle(color: online ? scheme.onPrimary : null)),
                value: online,
                onChanged: (v) => _toggle(context, ref, v),
              ),
            ),
          const SizedBox(height: 12),
          active.when(
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
            data: (o) => o == null
                ? const SizedBox.shrink()
                : Card(
                    color: scheme.primaryContainer,
                    child: ListTile(
                      leading: const Icon(Icons.navigation_outlined),
                      title: Text(tr('delivery.activeOrder', {'number': o.orderNumber})),
                      subtitle: Text(tr('status.${o.status}')),
                      trailing: const Icon(Icons.chevron_right),
                      onTap: () => Navigator.pushNamed(context, Routes.activeDelivery),
                    ),
                  ),
          ),
          if (approved && online) ...[
            const SizedBox(height: 8),
            Text(tr('delivery.availableOrders'), style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Consumer(builder: (context, ref, _) {
              final async = ref.watch(availableOrdersProvider);
              return async.when(
                loading: () => const LoadingView(),
                error: (e, _) => ErrorView(error: e, onRetry: () => ref.invalidate(availableOrdersProvider)),
                data: (list) => list.isEmpty
                    ? const EmptyState(icon: Icons.inbox_outlined, titleKey: 'delivery.noRequests')
                    : Column(children: list.map((o) => _RequestCard(data: o)).toList()),
              );
            }),
          ],
        ]),
      ),
    );
  }
}

class _RequestCard extends ConsumerStatefulWidget {
  final Map<String, dynamic> data;
  const _RequestCard({required this.data});
  @override
  ConsumerState<_RequestCard> createState() => _RequestCardState();
}

class _RequestCardState extends ConsumerState<_RequestCard> {
  bool _busy = false;

  Future<void> _accept() async {
    setState(() => _busy = true);
    try {
      await ApiService.instance.acceptDelivery(toStr(widget.data['_id']));
      ref.invalidate(activeDeliveryProvider);
      ref.invalidate(availableOrdersProvider);
      if (mounted) Navigator.pushNamed(context, Routes.activeDelivery);
    } catch (e) {
      if (mounted) showError(context, e);
      ref.invalidate(availableOrdersProvider);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _reject() async {
    await ApiService.instance.rejectDelivery(toStr(widget.data['_id']));
    ref.invalidate(availableOrdersProvider);
  }

  @override
  Widget build(BuildContext context) {
    final d = widget.data;
    final r = toMap(d['restaurant']);
    final drop = toMap(d['deliveryAddress']);
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: AppCard(
        onTap: () => Navigator.pushNamed(context, Routes.deliveryOrder, arguments: toStr(d['_id'])),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text(toStr(r['name']), style: const TextStyle(fontWeight: FontWeight.w800))),
            Text(Fmt.money(toDouble(d['payout'])),
                style: Theme.of(context).textTheme.titleLarge?.copyWith(color: AppColors.of(context).success, fontWeight: FontWeight.w800)),
          ]),
          Text(tr('delivery.pickup', {'address': toStr(toMap(r['address'])['fullAddress'])}), maxLines: 1, overflow: TextOverflow.ellipsis),
          Text(tr('delivery.drop', {'address': toStr(drop['fullAddress'])}), maxLines: 1, overflow: TextOverflow.ellipsis),
          const SizedBox(height: 4),
          Wrap(spacing: 12, children: [
            if (d['pickupDistanceKm'] != null) Text(tr('delivery.toPickup', {'km': Fmt.km(toDouble(d['pickupDistanceKm']))})),
            Text(tr('delivery.tripDistance', {'km': Fmt.km(toDouble(d['distanceKm']))})),
            Text(tr('delivery.itemsCount', {'count': toInt(d['itemCount'])})),
            if (toDouble(d['collectAmount']) > 0)
              Text(tr('delivery.collectCash', {'amount': Fmt.money(toDouble(d['collectAmount']))}), style: const TextStyle(fontWeight: FontWeight.w700)),
          ]),
          const SizedBox(height: 10),
          Row(children: [
            Expanded(child: OutlinedButton(onPressed: _busy ? null : _reject, child: Text(tr('delivery.reject')))),
            const SizedBox(width: 10),
            Expanded(child: ElevatedButton(onPressed: _busy ? null : _accept, child: Text(tr('delivery.accept')))),
          ]),
        ]),
      ),
    );
  }
}

/// Details of an order request (before or after acceptance).
class DeliveryOrderDetailScreen extends ConsumerWidget {
  final String orderId;
  const DeliveryOrderDetailScreen({super.key, required this.orderId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final list = ref.watch(availableOrdersProvider).valueOrNull ?? [];
    final d = list.where((e) => toStr(e['_id']) == orderId).firstOrNull;
    final active = ref.watch(activeDeliveryProvider).valueOrNull;
    if (active != null && active.id == orderId) return const ActiveDeliveryScreen();
    return Scaffold(
      appBar: AppBar(title: Text(tr('delivery.orderDetails'))),
      body: d == null
          ? const EmptyState(icon: Icons.info_outline, titleKey: 'delivery.requestExpired')
          : ListView(padding: const EdgeInsets.all(16), children: [_RequestCard(data: d)]),
    );
  }
}

class ActiveDeliveryScreen extends ConsumerStatefulWidget {
  const ActiveDeliveryScreen({super.key});
  @override
  ConsumerState<ActiveDeliveryScreen> createState() => _ActiveDeliveryScreenState();
}

class _ActiveDeliveryScreenState extends ConsumerState<ActiveDeliveryScreen> {
  bool _busy = false;

  Future<void> _picked(Order o) async {
    setState(() => _busy = true);
    try {
      await ApiService.instance.updateDeliveryStatus(o.id, 'picked');
      ref.invalidate(activeDeliveryProvider);
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(activeDeliveryProvider);
    return Scaffold(
      appBar: AppBar(title: Text(tr('delivery.activeDelivery'))),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(error: e, onRetry: () => ref.invalidate(activeDeliveryProvider)),
        data: (o) {
          if (o == null) return const EmptyState(icon: Icons.check_circle_outline, titleKey: 'delivery.noActive');
          final toRestaurant = o.status != 'picked';
          final targetLat = toRestaurant ? o.restaurant.lat : o.dropLat;
          final targetLng = toRestaurant ? o.restaurant.lng : o.dropLng;
          final phone = toRestaurant
              ? o.restaurant.phone
              : (o.deliveryAddress['contactPhone']?.toString().isNotEmpty == true ? o.deliveryAddress['contactPhone'].toString() : o.customer.phone);
          return ListView(padding: const EdgeInsets.all(16), children: [
            if (targetLat != null && targetLng != null)
              SizedBox(
                height: 220,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(AppColors.of(context).cardRadius),
                  child: MapOrFallback(
                    target: LatLng(targetLat, targetLng),
                    map: () => GoogleMap(
                      initialCameraPosition: CameraPosition(target: LatLng(targetLat, targetLng), zoom: 14),
                      myLocationEnabled: true,
                      zoomControlsEnabled: false,
                      markers: {Marker(markerId: const MarkerId('target'), position: LatLng(targetLat, targetLng))},
                    ),
                  ),
                ),
              ),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(child: Text(tr('order.number', {'number': o.orderNumber}), style: const TextStyle(fontWeight: FontWeight.w800))),
              StatusChip(o.status)
            ]),
            const SizedBox(height: 12),
            AppCard(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(tr(toRestaurant ? 'delivery.headToRestaurant' : 'delivery.headToCustomer'),
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 6),
                Text(toRestaurant ? o.restaurant.name : toStr(o.deliveryAddress['contactName'], o.customer.name),
                    style: const TextStyle(fontWeight: FontWeight.w600)),
                Text(toRestaurant ? o.restaurant.address : toStr(o.deliveryAddress['fullAddress'])),
                if (!toRestaurant && toStr(o.deliveryAddress['landmark']).isNotEmpty)
                  Text(toStr(o.deliveryAddress['landmark']), style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: 10),
                Row(children: [
                  if (targetLat != null)
                    Expanded(
                        child: OutlinedButton.icon(
                            onPressed: () => openNavigation(targetLat, targetLng!),
                            icon: const Icon(Icons.navigation_outlined),
                            label: Text(tr('delivery.navigate')))),
                  if (phone.isNotEmpty) ...[
                    const SizedBox(width: 10),
                    Expanded(
                        child: OutlinedButton.icon(
                            onPressed: () => launchUrl(Uri.parse('tel:$phone')), icon: const Icon(Icons.call), label: Text(tr('delivery.call')))),
                  ],
                ]),
              ]),
            ),
            const SizedBox(height: 12),
            AppCard(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                for (final i in o.items) Text(tr('order.itemQty', {'qty': i.quantity, 'name': i.name})),
                const Divider(),
                if (o.paymentMethod == 'cod')
                  Text(tr('delivery.collectCash', {'amount': Fmt.money(o.bill.payable)}), style: const TextStyle(fontWeight: FontWeight.w800)),
                Text(tr('delivery.yourPayout', {'amount': Fmt.money(o.deliveryEarning)})),
              ]),
            ),
          ]);
        },
      ),
      bottomNavigationBar: async.valueOrNull == null
          ? null
          : SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Builder(builder: (_) {
                  final o = async.value!;
                  if (o.status == 'picked') {
                    return AppButton(
                        labelKey: 'delivery.markDelivered', onPressed: () => Navigator.pushNamed(context, Routes.deliveryComplete, arguments: o.id));
                  }
                  final canPick = o.status == 'ready' || o.status == 'preparing';
                  return AppButton(
                      labelKey: canPick ? 'delivery.markPicked' : 'delivery.waitingForRestaurant',
                      loading: _busy,
                      onPressed: canPick ? () => _picked(o) : null);
                }),
              ),
            ),
    );
  }
}

/// Proof of delivery: photo (if `deliveryPhotoProof`) + customer OTP (if `deliveryOtp`).
class DeliveryCompleteScreen extends ConsumerStatefulWidget {
  final String orderId;
  const DeliveryCompleteScreen({super.key, required this.orderId});
  @override
  ConsumerState<DeliveryCompleteScreen> createState() => _DeliveryCompleteScreenState();
}

class _DeliveryCompleteScreenState extends ConsumerState<DeliveryCompleteScreen> {
  final _otp = TextEditingController();
  String? _photo;
  bool _busy = false;

  Future<void> _takePhoto() async {
    final f = await ImagePicker().pickImage(source: ImageSource.camera, maxWidth: 1200);
    if (f == null) return;
    try {
      final url = await ApiService.instance.upload(f.path, folder: 'delivery-proof');
      setState(() => _photo = url);
    } catch (e) {
      if (mounted) showError(context, e);
    }
  }

  Future<void> _complete() async {
    setState(() => _busy = true);
    try {
      await ApiService.instance.updateDeliveryStatus(widget.orderId, 'delivered', otp: _otp.text.trim().isEmpty ? null : _otp.text.trim(), photoUrl: _photo);
      ref.invalidate(activeDeliveryProvider);
      await ref.read(authProvider.notifier).refresh();
      if (!mounted) return;
      showMessage(context, 'delivery.completed');
      Navigator.of(context).pushNamedAndRemoveUntil(Routes.deliveryHome, (_) => false);
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cfg = ref.watch(appConfigProvider);
    final needPhoto = cfg.feature('deliveryPhotoProof');
    final needOtp = cfg.feature('deliveryOtp');
    return Scaffold(
      appBar: AppBar(title: Text(tr('delivery.completeTitle'))),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        if (needOtp) ...[
          Text(tr('delivery.askOtp')),
          const SizedBox(height: 8),
          AppInput(controller: _otp, labelKey: 'auth.otp', keyboardType: TextInputType.number, icon: Icons.pin),
        ],
        if (needPhoto) ...[
          Text(tr('delivery.takePhoto')),
          const SizedBox(height: 8),
          GestureDetector(
            onTap: _takePhoto,
            child: _photo == null
                ? Container(
                    height: 200,
                    decoration: BoxDecoration(border: Border.all(color: Theme.of(context).colorScheme.outline), borderRadius: BorderRadius.circular(12)),
                    child: const Center(child: Icon(Icons.photo_camera_outlined, size: 48)),
                  )
                : NetImage(_photo!, height: 200, width: double.infinity, radius: 12),
          ),
        ],
      ]),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: AppButton(labelKey: 'delivery.confirmDelivered', loading: _busy, onPressed: (needPhoto && _photo == null) ? null : _complete),
        ),
      ),
    );
  }
}

final deliveryEarningsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) => ApiService.instance.deliveryEarnings());

/// Earnings; payout formula shown from businessRules.deliveryPartnerPayout.
class DeliveryEarningsScreen extends ConsumerWidget {
  final bool embedded;
  const DeliveryEarningsScreen({super.key, this.embedded = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(deliveryEarningsProvider);
    final scheme = Theme.of(context).colorScheme;
    final body = async.when(
      loading: () => const LoadingView(),
      error: (e, _) => ErrorView(error: e, onRetry: () => ref.invalidate(deliveryEarningsProvider)),
      data: (d) {
        final today = toMap(d['today']);
        final daily = toList(d['daily']).map((e) => toMap(e)).toList();
        final rules = toMap(d['payoutRules']);
        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(deliveryEarningsProvider),
          child: ListView(padding: const EdgeInsets.all(16), children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: scheme.primary, borderRadius: BorderRadius.circular(16)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(tr('delivery.todayEarnings'), style: TextStyle(color: scheme.onPrimary)),
                Text(Fmt.money(toDouble(today['earnings'])),
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: scheme.onPrimary, fontWeight: FontWeight.w800)),
                Text(tr('delivery.todayDeliveries', {'count': toInt(today['deliveries'])}), style: TextStyle(color: scheme.onPrimary)),
              ]),
            ),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(
                  child: AppCard(
                      child: Column(children: [
                Text(Fmt.money(toDouble(d['totalEarnings'])), style: Theme.of(context).textTheme.titleLarge),
                Text(tr('delivery.totalEarnings'))
              ]))),
              const SizedBox(width: 10),
              Expanded(
                  child: AppCard(
                      child: Column(children: [
                Text(Fmt.money(toDouble(d['walletBalance'])), style: Theme.of(context).textTheme.titleLarge),
                Text(tr('delivery.pendingPayout'))
              ]))),
            ]),
            const SizedBox(height: 10),
            Row(children: [
              Expanded(
                  child: AppCard(
                      child: Column(children: [
                Text('${toInt(d['totalDeliveries'])}', style: Theme.of(context).textTheme.titleLarge),
                Text(tr('delivery.totalDeliveries'))
              ]))),
              const SizedBox(width: 10),
              Expanded(
                  child: AppCard(
                      child: Column(children: [
                Text(toDouble(d['rating']).toStringAsFixed(1), style: Theme.of(context).textTheme.titleLarge),
                Text(tr('delivery.rating'))
              ]))),
            ]),
            const SizedBox(height: 12),
            AppCard(
              child: Text(tr('delivery.payoutFormula', {
                'base': Fmt.money(toDouble(rules['base'])),
                'perKm': Fmt.money(toDouble(rules['perKm'])),
                'tipShare': toDouble(rules['tipSharePercent'], 100).toStringAsFixed(0),
              })),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 180,
              child: daily.isEmpty
                  ? const EmptyState(icon: Icons.bar_chart, titleKey: 'vendor.noData')
                  : BarChart(BarChartData(
                      borderData: FlBorderData(show: false),
                      gridData: const FlGridData(show: false),
                      titlesData: const FlTitlesData(
                        topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      ),
                      barGroups: [
                        for (var i = 0; i < daily.length; i++)
                          BarChartGroupData(x: i, barRods: [
                            BarChartRodData(toY: toDouble(daily[i]['earnings']), color: scheme.primary, width: 14, borderRadius: BorderRadius.circular(4))
                          ]),
                      ],
                    )),
            ),
          ]),
        );
      },
    );
    if (embedded) {
      return SafeArea(child: Column(children: [AppBar(title: Text(tr('delivery.nav.earnings')), automaticallyImplyLeading: false), Expanded(child: body)]));
    }
    return Scaffold(appBar: AppBar(title: Text(tr('delivery.nav.earnings'))), body: body);
  }
}

final deliveryHistoryProvider = FutureProvider.autoDispose<List<Order>>((ref) async {
  final d = await ApiService.instance.deliveryHistory();
  return toList(d['items']).map((e) => Order.fromJson(toMap(e))).toList();
});

class DeliveryHistoryScreen extends ConsumerWidget {
  final bool embedded;
  const DeliveryHistoryScreen({super.key, this.embedded = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(deliveryHistoryProvider);
    final body = async.when(
      loading: () => const LoadingView(),
      error: (e, _) => ErrorView(error: e, onRetry: () => ref.invalidate(deliveryHistoryProvider)),
      data: (list) => list.isEmpty
          ? const EmptyState(icon: Icons.history, titleKey: 'delivery.noHistory')
          : RefreshIndicator(
              onRefresh: () async => ref.invalidate(deliveryHistoryProvider),
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: list.length,
                separatorBuilder: (_, __) => const SizedBox(height: 8),
                itemBuilder: (_, i) {
                  final o = list[i];
                  return AppCard(
                    child: Row(children: [
                      Expanded(
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(o.restaurant.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                          Text(tr('order.number', {'number': o.orderNumber}), style: Theme.of(context).textTheme.bodySmall),
                          Text(Fmt.dateTime(o.createdAt), style: Theme.of(context).textTheme.bodySmall),
                        ]),
                      ),
                      Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                        StatusChip(o.status),
                        const SizedBox(height: 4),
                        if (o.status == 'delivered') Text(Fmt.money(o.deliveryEarning), style: const TextStyle(fontWeight: FontWeight.w800)),
                      ]),
                    ]),
                  );
                },
              ),
            ),
    );
    if (embedded) {
      return SafeArea(child: Column(children: [AppBar(title: Text(tr('delivery.nav.history')), automaticallyImplyLeading: false), Expanded(child: body)]));
    }
    return Scaffold(appBar: AppBar(title: Text(tr('delivery.nav.history'))), body: body);
  }
}

class DeliveryMoreTab extends StatelessWidget {
  const DeliveryMoreTab({super.key});

  @override
  Widget build(BuildContext context) {
    Widget tile(IconData i, String k, String route) =>
        ListTile(leading: Icon(i), title: Text(tr(k)), trailing: const Icon(Icons.chevron_right), onTap: () => Navigator.pushNamed(context, route));
    return Scaffold(
      appBar: AppBar(title: Text(tr('delivery.nav.more')), automaticallyImplyLeading: false),
      body: ListView(children: [
        tile(Icons.two_wheeler, 'delivery.vehicleProfile', Routes.deliveryProfile),
        tile(Icons.person_outline, 'profile.edit', Routes.editProfile),
        tile(Icons.notifications_none, 'notifications.title', Routes.notifications),
        tile(Icons.settings_outlined, 'settings.title', Routes.settings),
      ]),
    );
  }
}

class DeliveryProfileScreen extends ConsumerStatefulWidget {
  final bool onboarding;
  const DeliveryProfileScreen({super.key, this.onboarding = false});
  @override
  ConsumerState<DeliveryProfileScreen> createState() => _DeliveryProfileScreenState();
}

class _DeliveryProfileScreenState extends ConsumerState<DeliveryProfileScreen> {
  final _vehicleNumber = TextEditingController();
  final _license = TextEditingController();
  final _accountName = TextEditingController();
  final _accountNumber = TextEditingController();
  final _ifsc = TextEditingController();
  final _upi = TextEditingController();
  String _vehicle = 'bike';
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final p = ref.read(authProvider).deliveryProfile ?? {};
    _vehicle = toStr(p['vehicleType'], 'bike');
    _vehicleNumber.text = toStr(p['vehicleNumber']);
    _license.text = toStr(p['licenseNumber']);
    final bank = toMap(p['bankDetails']);
    _accountName.text = toStr(bank['accountName']);
    _accountNumber.text = toStr(bank['accountNumber']);
    _ifsc.text = toStr(bank['ifsc']);
    _upi.text = toStr(bank['upiId']);
  }

  Future<void> _save() async {
    if (_vehicleNumber.text.trim().isEmpty) {
      showMessage(context, 'validation.required');
      return;
    }
    setState(() => _saving = true);
    try {
      final dp = await ApiService.instance.registerDelivery({
        'vehicleType': _vehicle,
        'vehicleNumber': _vehicleNumber.text.trim(),
        'licenseNumber': _license.text.trim(),
        'bankDetails': {
          'accountName': _accountName.text.trim(),
          'accountNumber': _accountNumber.text.trim(),
          'ifsc': _ifsc.text.trim(),
          'upiId': _upi.text.trim()
        },
      });
      ref.read(authProvider.notifier).updateDeliveryProfile(dp);
      if (mounted) {
        showMessage(context, 'delivery.profileSaved');
        if (!widget.onboarding) Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(
          title: Text(tr(widget.onboarding ? 'delivery.setupTitle' : 'delivery.vehicleProfile')),
          automaticallyImplyLeading: !widget.onboarding,
          actions: [
            if (widget.onboarding) IconButton(icon: const Icon(Icons.settings_outlined), onPressed: () => Navigator.pushNamed(context, Routes.settings))
          ],
        ),
        body: ListView(padding: const EdgeInsets.all(16), children: [
          if (widget.onboarding) Padding(padding: const EdgeInsets.only(bottom: 16), child: Text(tr('delivery.setupSubtitle'))),
          Wrap(spacing: 8, children: [
            for (final v in const ['bicycle', 'bike', 'scooter', 'car'])
              ChoiceChip(label: Text(tr('vehicle.$v')), selected: _vehicle == v, onSelected: (_) => setState(() => _vehicle = v)),
          ]),
          const SizedBox(height: 16),
          AppInput(controller: _vehicleNumber, labelKey: 'delivery.vehicleNumber'),
          AppInput(controller: _license, labelKey: 'delivery.licenseNumber'),
          Text(tr('delivery.bankDetails'), style: const TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          AppInput(controller: _accountName, labelKey: 'bank.accountName'),
          AppInput(controller: _accountNumber, labelKey: 'bank.accountNumber', keyboardType: TextInputType.number),
          AppInput(controller: _ifsc, labelKey: 'bank.ifsc'),
          AppInput(controller: _upi, labelKey: 'bank.upi'),
          AppButton(labelKey: widget.onboarding ? 'delivery.submitForApproval' : 'common.save', loading: _saving, onPressed: _save),
        ]),
      );
}
