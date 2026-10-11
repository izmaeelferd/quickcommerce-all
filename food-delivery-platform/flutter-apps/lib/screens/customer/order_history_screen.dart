import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/formatters.dart';
import '../../core/routes.dart';
import '../../core/translation_manager.dart';
import '../../models/cart.dart';
import '../../models/json_utils.dart';
import '../../models/menu_item.dart';
import '../../models/order.dart';
import '../../providers/cart_provider.dart';
import '../../providers/order_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/common/cards.dart';
import '../../widgets/common/states.dart';
import '../../widgets/common/status_chip.dart';

class OrderHistoryScreen extends ConsumerWidget {
  final bool embedded;
  const OrderHistoryScreen({super.key, this.embedded = false});

  Future<void> _reorder(BuildContext context, WidgetRef ref, Order o) async {
    try {
      final data = await ApiService.instance.reorder(o.id);
      final items = toList(data['items']);
      if (items.isEmpty) {
        if (context.mounted) showMessage(context, 'order.reorderUnavailable');
        return;
      }
      final cart = ref.read(cartProvider.notifier);
      cart.clear();
      for (final raw in items) {
        final m = toMap(raw);
        final item = MenuItem.fromJson(toMap(m['item']));
        final selections = toList(m['addOns']).map((a) {
          final am = toMap(a);
          final group = item.addOns.firstWhere((g) => g.id == toStr(am['groupId']));
          final ids = toList(am['optionIds']).map((e) => e.toString()).toSet();
          return CartAddOnSelection(group.id, group.name, group.options.where((op) => ids.contains(op.id)).toList());
        }).toList();
        cart.add(item, restaurantName: o.restaurant.name, quantity: toInt(m['quantity'], 1), addOns: selections, replace: true);
      }
      if (toInt(data['unavailableCount']) > 0 && context.mounted) showMessage(context, 'order.reorderPartial', {'count': data['unavailableCount']});
      if (context.mounted) Navigator.pushNamed(context, Routes.cart);
    } catch (e) {
      if (context.mounted) showError(context, e);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(orderHistoryProvider);
    final body = async.when(
      loading: () => const LoadingView(),
      error: (e, _) => ErrorView(error: e, onRetry: () => ref.invalidate(orderHistoryProvider)),
      data: (list) => list.isEmpty
          ? const EmptyState(icon: Icons.receipt_long_outlined, titleKey: 'order.noOrders')
          : RefreshIndicator(
              onRefresh: () async => ref.invalidate(orderHistoryProvider),
              child: ListView.separated(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 90),
                itemCount: list.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder: (_, i) {
                  final o = list[i];
                  return AppCard(
                    onTap: () => Navigator.pushNamed(context, Routes.tracking, arguments: o.id),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [
                        ClipRRect(borderRadius: BorderRadius.circular(8), child: NetImage(o.restaurant.logo, width: 44, height: 44)),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(o.restaurant.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                            Text(Fmt.dateTime(o.createdAt), style: Theme.of(context).textTheme.bodySmall),
                          ]),
                        ),
                        StatusChip(o.status),
                      ]),
                      const Divider(),
                      Text(o.items.map((e) => tr('order.itemQty', {'qty': e.quantity, 'name': e.name})).join(', '),
                          maxLines: 2, overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 6),
                      Row(children: [
                        Text(Fmt.money(o.bill.total), style: const TextStyle(fontWeight: FontWeight.w700)),
                        const Spacer(),
                        if (!o.isActive)
                          TextButton.icon(onPressed: () => _reorder(context, ref, o), icon: const Icon(Icons.replay), label: Text(tr('order.reorder'))),
                      ]),
                    ]),
                  );
                },
              ),
            ),
    );
    if (embedded) return SafeArea(child: Column(children: [AppBar(title: Text(tr('nav.orders')), automaticallyImplyLeading: false), Expanded(child: body)]));
    return Scaffold(appBar: AppBar(title: Text(tr('nav.orders'))), body: body);
  }
}
