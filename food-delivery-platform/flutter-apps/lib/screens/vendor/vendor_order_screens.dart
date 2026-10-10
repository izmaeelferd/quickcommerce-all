import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/formatters.dart';
import '../../core/routes.dart';
import '../../core/translation_manager.dart';
import '../../models/json_utils.dart';
import '../../models/order.dart';
import '../../providers/auth_provider.dart';
import '../../providers/order_provider.dart';
import '../../services/api_service.dart';
import '../../services/socket_service.dart';
import '../../widgets/common/cards.dart';
import '../../widgets/common/states.dart';
import '../../widgets/common/status_chip.dart';
import '../customer/order_tracking_screen.dart' show OrderSummary;

final vendorStatsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) => ApiService.instance.vendorStats());

final vendorOrdersProvider = FutureProvider.autoDispose.family<List<Order>, String>((ref, status) async {
  final sub = SocketService.instance.on('order:status-update').listen((_) => ref.invalidateSelf());
  ref.onDispose(sub.cancel);
  final data = await ApiService.instance.vendorOrders(status: status);
  return toList(data['items']).map((e) => Order.fromJson(toMap(e))).toList();
});

class VendorDashboardTab extends ConsumerWidget {
  const VendorDashboardTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final r = auth.restaurant!;
    final async = ref.watch(vendorStatsProvider);
    final scheme = Theme.of(context).colorScheme;
    return SafeArea(
      child: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(vendorStatsProvider);
          await ref.read(authProvider.notifier).refresh();
        },
        child: ListView(padding: const EdgeInsets.all(16), children: [
          Row(children: [
            ClipOval(child: NetImage(r.logo, width: 48, height: 48)),
            const SizedBox(width: 12),
            Expanded(child: Text(r.name, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800))),
          ]),
          if (r.status != 'approved') ...[
            const SizedBox(height: 12),
            Card(
              color: scheme.errorContainer,
              child: ListTile(
                  leading: const Icon(Icons.hourglass_top), title: Text(tr('vendor.status.${r.status}')), subtitle: Text(tr('vendor.statusHint.${r.status}'))),
            ),
          ],
          const SizedBox(height: 12),
          AppCard(
            padding: EdgeInsets.zero,
            child: Column(children: [
              SwitchListTile(
                title: Text(tr('vendor.restaurantOpen')),
                value: r.isOpen,
                onChanged: (v) async {
                  try {
                    ref.read(authProvider.notifier).updateRestaurant(await ApiService.instance.setRestaurantStatus(isOpen: v));
                  } catch (e) {
                    if (context.mounted) showError(context, e);
                  }
                },
              ),
              SwitchListTile(
                title: Text(tr('vendor.acceptingOrders')),
                value: r.acceptingOrders,
                onChanged: (v) async {
                  try {
                    ref.read(authProvider.notifier).updateRestaurant(await ApiService.instance.setRestaurantStatus(acceptingOrders: v));
                  } catch (e) {
                    if (context.mounted) showError(context, e);
                  }
                },
              ),
            ]),
          ),
          const SizedBox(height: 12),
          async.when(
            loading: () => const LoadingView(),
            error: (e, _) => ErrorView(error: e, onRetry: () => ref.invalidate(vendorStatsProvider)),
            data: (s) {
              final today = toMap(s['today']);
              final totals = toMap(s['totals']);
              final daily = toList(s['daily']).map((e) => toMap(e)).toList();
              final top = toList(s['topItems']).map((e) => toMap(e)).toList();
              Widget stat(String key, String value, IconData icon) => Expanded(
                    child: AppCard(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Icon(icon, color: scheme.primary),
                        const SizedBox(height: 6),
                        Text(value, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
                        Text(tr(key), style: Theme.of(context).textTheme.bodySmall),
                      ]),
                    ),
                  );
              return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  stat('vendor.todayOrders', '${toInt(today['orders'])}', Icons.receipt),
                  const SizedBox(width: 10),
                  stat('vendor.todayEarnings', Fmt.money(toDouble(today['revenue'])), Icons.payments_outlined),
                ]),
                const SizedBox(height: 10),
                Row(children: [
                  stat('vendor.pending', '${toInt(s['pendingOrders'])}', Icons.pending_actions),
                  const SizedBox(width: 10),
                  stat('vendor.commission', '${toDouble(s['commissionPercent']).toStringAsFixed(1)}%', Icons.percent),
                ]),
                const SizedBox(height: 10),
                Row(children: [
                  stat('vendor.totalOrders', '${toInt(totals['orders'])}', Icons.shopping_bag_outlined),
                  const SizedBox(width: 10),
                  stat('vendor.totalEarnings', Fmt.money(toDouble(totals['earnings'])), Icons.account_balance_wallet_outlined),
                ]),
                const SizedBox(height: 16),
                Text(tr('vendor.last7Days'), style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                SizedBox(
                  height: 180,
                  child: daily.isEmpty
                      ? const EmptyState(icon: Icons.bar_chart, titleKey: 'vendor.noData')
                      : BarChart(BarChartData(
                          borderData: FlBorderData(show: false),
                          gridData: const FlGridData(show: false),
                          titlesData: FlTitlesData(
                            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                            leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                            bottomTitles: AxisTitles(
                              sideTitles: SideTitles(
                                showTitles: true,
                                getTitlesWidget: (v, _) {
                                  final i = v.toInt();
                                  if (i < 0 || i >= daily.length) return const SizedBox.shrink();
                                  final d = toStr(daily[i]['_id']);
                                  return Text(d.length >= 10 ? d.substring(8) : d, style: Theme.of(context).textTheme.bodySmall);
                                },
                              ),
                            ),
                          ),
                          barGroups: [
                            for (var i = 0; i < daily.length; i++)
                              BarChartGroupData(x: i, barRods: [
                                BarChartRodData(toY: toDouble(daily[i]['earnings']), color: scheme.primary, width: 14, borderRadius: BorderRadius.circular(4))
                              ]),
                          ],
                        )),
                ),
                if (top.isNotEmpty) ...[
                  const SizedBox(height: 16),
                  Text(tr('vendor.topItems'), style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                  for (final t in top)
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text(toStr(t['_id'])),
                      subtitle: Text(tr('vendor.soldCount', {'count': toInt(t['qty'])})),
                      trailing: Text(Fmt.money(toDouble(t['revenue']))),
                    ),
                ],
              ]);
            },
          ),
        ]),
      ),
    );
  }
}

class VendorOrdersTab extends StatelessWidget {
  const VendorOrdersTab({super.key});

  static const groups = {
    'vendor.tab.new': 'placed',
    'vendor.tab.inProgress': 'accepted,preparing,ready',
    'vendor.tab.outForDelivery': 'picked',
    'vendor.tab.past': 'delivered,cancelled,rejected'
  };

  @override
  Widget build(BuildContext context) => DefaultTabController(
        length: groups.length,
        child: Scaffold(
          appBar: AppBar(
            title: Text(tr('vendor.nav.orders')),
            automaticallyImplyLeading: false,
            bottom: TabBar(isScrollable: true, tabs: groups.keys.map((k) => Tab(text: tr(k))).toList()),
          ),
          body: TabBarView(children: groups.values.map((s) => _VendorOrderList(status: s)).toList()),
        ),
      );
}

class _VendorOrderList extends ConsumerWidget {
  final String status;
  const _VendorOrderList({required this.status});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(vendorOrdersProvider(status));
    return async.when(
      loading: () => const LoadingView(),
      error: (e, _) => ErrorView(error: e, onRetry: () => ref.invalidate(vendorOrdersProvider(status))),
      data: (list) => list.isEmpty
          ? const EmptyState(icon: Icons.inbox_outlined, titleKey: 'vendor.noOrders')
          : RefreshIndicator(
              onRefresh: () async => ref.invalidate(vendorOrdersProvider(status)),
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: list.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (_, i) {
                  final o = list[i];
                  return AppCard(
                    onTap: () => Navigator.pushNamed(context, Routes.vendorOrder, arguments: o.id),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        Expanded(child: Text(tr('order.number', {'number': o.orderNumber}), style: const TextStyle(fontWeight: FontWeight.w800))),
                        StatusChip(o.status),
                      ]),
                      Text(Fmt.dateTime(o.createdAt), style: Theme.of(context).textTheme.bodySmall),
                      if (o.scheduledFor != null)
                        Text(tr('vendor.scheduledFor', {'time': Fmt.dateTime(o.scheduledFor)}), style: TextStyle(color: Theme.of(context).colorScheme.primary)),
                      const SizedBox(height: 6),
                      Text(o.items.map((e) => tr('order.itemQty', {'qty': e.quantity, 'name': e.name})).join(', ')),
                      const SizedBox(height: 6),
                      Row(children: [
                        Text(tr('vendor.youEarn', {'amount': Fmt.money(o.vendorEarning)}), style: const TextStyle(fontWeight: FontWeight.w700)),
                        const Spacer(),
                        Text(tr('payment.method.${o.paymentMethod}')),
                      ]),
                    ]),
                  );
                },
              ),
            ),
    );
  }
}

class VendorOrderDetailScreen extends ConsumerStatefulWidget {
  final String orderId;
  const VendorOrderDetailScreen({super.key, required this.orderId});
  @override
  ConsumerState<VendorOrderDetailScreen> createState() => _VendorOrderDetailScreenState();
}

class _VendorOrderDetailScreenState extends ConsumerState<VendorOrderDetailScreen> {
  bool _busy = false;

  Future<void> _update(String status, {bool askReason = false}) async {
    String? reason;
    if (askReason) {
      reason = await promptDialog(context, titleKey: 'vendor.rejectTitle', labelKey: 'order.cancelReason');
      if (reason == null) return;
    }
    setState(() => _busy = true);
    try {
      await ApiService.instance.vendorUpdateOrder(widget.orderId, status, reason: reason);
      await ref.read(orderTrackerProvider(widget.orderId).notifier).refresh();
      ref.invalidate(vendorOrdersProvider);
      ref.invalidate(vendorStatsProvider);
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(orderTrackerProvider(widget.orderId));
    final o = state.order;
    if (o == null) return Scaffold(appBar: AppBar(), body: state.error != null ? ErrorView(error: state.error!) : const LoadingView());
    final actions = <Widget>[
      if (o.status == 'placed') ...[
        Expanded(child: OutlinedButton(onPressed: _busy ? null : () => _update('rejected', askReason: true), child: Text(tr('vendor.reject')))),
        const SizedBox(width: 12),
        Expanded(child: ElevatedButton(onPressed: _busy ? null : () => _update('accepted'), child: Text(tr('vendor.accept')))),
      ],
      if (o.status == 'accepted')
        Expanded(child: ElevatedButton(onPressed: _busy ? null : () => _update('preparing'), child: Text(tr('vendor.startPreparing')))),
      if (o.status == 'preparing') Expanded(child: ElevatedButton(onPressed: _busy ? null : () => _update('ready'), child: Text(tr('vendor.markReady')))),
    ];
    return Scaffold(
      appBar: AppBar(
          title: Text(tr('order.number', {'number': o.orderNumber})),
          actions: [Padding(padding: const EdgeInsets.only(right: 12), child: Center(child: StatusChip(o.status)))]),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        AppCard(
          padding: EdgeInsets.zero,
          child: Column(children: [
            ListTile(
              leading: const Icon(Icons.person_outline),
              title: Text(o.customer.name),
              subtitle: Text(toStr(o.deliveryAddress['fullAddress'])),
            ),
            if (o.deliveryPartner != null)
              ListTile(
                leading: const Icon(Icons.delivery_dining),
                title: Text(o.deliveryPartner!.name),
                subtitle: Text(tr('order.yourRider')),
                trailing: o.deliveryPartner!.phone.isEmpty
                    ? null
                    : IconButton(icon: const Icon(Icons.call), onPressed: () => launchUrl(Uri.parse('tel:${o.deliveryPartner!.phone}'))),
              ),
            if (o.instructions.isNotEmpty) ListTile(leading: const Icon(Icons.edit_note), title: Text(o.instructions)),
          ]),
        ),
        const SizedBox(height: 12),
        AppCard(child: OrderSummary(order: o)),
        const SizedBox(height: 12),
        AppCard(
          child: Column(children: [
            _row(context, 'vendor.commissionLine', -o.commissionAmount, vars: {'percent': o.commissionPercent.toStringAsFixed(1)}),
            _row(context, 'vendor.youEarn', o.vendorEarning, bold: true, vars: {'amount': ''}),
          ]),
        ),
      ]),
      bottomNavigationBar: actions.isEmpty ? null : SafeArea(child: Padding(padding: const EdgeInsets.all(16), child: Row(children: actions))),
    );
  }

  Widget _row(BuildContext context, String key, double v, {bool bold = false, Map<String, Object?> vars = const {}}) => Row(children: [
        Expanded(child: Text(tr(key, vars), style: bold ? const TextStyle(fontWeight: FontWeight.w800) : null)),
        Text(v < 0 ? '-${Fmt.money(-v)}' : Fmt.money(v), style: bold ? const TextStyle(fontWeight: FontWeight.w800) : null),
      ]);
}
