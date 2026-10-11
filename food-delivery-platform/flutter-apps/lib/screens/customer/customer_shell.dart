import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/formatters.dart';
import '../../core/routes.dart';
import '../../core/translation_manager.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/config_provider.dart';
import '../../providers/order_provider.dart';
import '../../providers/restaurant_provider.dart';
import '../../widgets/dynamic/section_renderer.dart';
import '../../widgets/dynamic/offer_card.dart';
import 'order_history_screen.dart';
import 'profile_screens.dart';
import 'search_screen.dart';

class CustomerShell extends ConsumerStatefulWidget {
  const CustomerShell({super.key});
  @override
  ConsumerState<CustomerShell> createState() => _CustomerShellState();
}

class _CustomerShellState extends ConsumerState<CustomerShell> {
  int _tab = 0;

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);
    final tabs = [const HomeTab(), const SearchScreen(args: {}, embedded: true), const OrderHistoryScreen(embedded: true), const ProfileTab()];
    return Scaffold(
      body: IndexedStack(index: _tab, children: tabs),
      bottomSheet: cart.isEmpty ? null : const CartBar(),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() => _tab = i),
        destinations: [
          NavigationDestination(icon: const Icon(Icons.home_outlined), selectedIcon: const Icon(Icons.home), label: tr('nav.home')),
          NavigationDestination(icon: const Icon(Icons.search), label: tr('nav.search')),
          NavigationDestination(icon: const Icon(Icons.receipt_long_outlined), selectedIcon: const Icon(Icons.receipt_long), label: tr('nav.orders')),
          NavigationDestination(icon: const Icon(Icons.person_outline), selectedIcon: const Icon(Icons.person), label: tr('nav.profile')),
        ],
      ),
    );
  }
}

class CartBar extends ConsumerWidget {
  const CartBar({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartProvider);
    final scheme = Theme.of(context).colorScheme;
    return Material(
      color: scheme.primary,
      child: InkWell(
        onTap: () => Navigator.pushNamed(context, Routes.cart),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(children: [
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                  Text(tr('cart.itemsCount', {'count': cart.count, 'total': Fmt.money(cart.subtotal)}),
                      style: TextStyle(color: scheme.onPrimary, fontWeight: FontWeight.bold)),
                  Text(cart.restaurantName, maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: scheme.onPrimary)),
                ]),
              ),
              Text(tr('cart.view'), style: TextStyle(color: scheme.onPrimary, fontWeight: FontWeight.bold)),
              Icon(Icons.chevron_right, color: scheme.onPrimary),
            ]),
          ),
        ),
      ),
    );
  }
}

/// Home renders every enabled homeLayout section in configured order.
class HomeTab extends ConsumerWidget {
  const HomeTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cfg = ref.watch(appConfigProvider);
    final user = ref.watch(authProvider).user;
    final sections = cfg.enabledSections;
    final address = user?.defaultAddress;
    return SafeArea(
      child: RefreshIndicator(
        onRefresh: () async {
          await ref.read(configProvider.notifier).load(silent: true);
          ref.invalidate(restaurantListProvider);
          ref.invalidate(couponsProvider);
          ref.invalidate(activeOrdersProvider);
        },
        child: CustomScrollView(slivers: [
          SliverAppBar(
            floating: true,
            titleSpacing: 16,
            title: InkWell(
              onTap: () => Navigator.pushNamed(context, Routes.addresses),
              child: Row(children: [
                Icon(Icons.location_on, color: Theme.of(context).colorScheme.primary),
                const SizedBox(width: 6),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(address?.label.isNotEmpty == true ? address!.label : tr('home.deliverTo'),
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                    Text(address?.fullAddress ?? tr('home.addAddress'),
                        maxLines: 1, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.bodySmall),
                  ]),
                ),
              ]),
            ),
            actions: [IconButton(icon: const Icon(Icons.notifications_none), onPressed: () => Navigator.pushNamed(context, Routes.notifications))],
          ),
          const SliverToBoxAdapter(child: _ActiveOrderBanner()),
          SliverList.builder(itemCount: sections.length, itemBuilder: (_, i) => SectionRenderer(key: ValueKey(sections[i].id), section: sections[i])),
          const SliverToBoxAdapter(child: SizedBox(height: 90)),
        ]),
      ),
    );
  }
}

class _ActiveOrderBanner extends ConsumerWidget {
  const _ActiveOrderBanner();
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(activeOrdersProvider);
    final orders = async.valueOrNull ?? const [];
    if (orders.isEmpty) return const SizedBox.shrink();
    final o = orders.first;
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: Material(
        color: scheme.primaryContainer,
        borderRadius: BorderRadius.circular(12),
        child: ListTile(
          leading: Icon(Icons.delivery_dining, color: scheme.onPrimaryContainer),
          title: Text(o.restaurant.name, style: TextStyle(color: scheme.onPrimaryContainer, fontWeight: FontWeight.bold)),
          subtitle: Text(tr('status.${o.status}'), style: TextStyle(color: scheme.onPrimaryContainer)),
          trailing: Text(tr('order.track'), style: TextStyle(color: scheme.onPrimaryContainer, fontWeight: FontWeight.bold)),
          onTap: () => Navigator.pushNamed(context, Routes.tracking, arguments: o.id),
        ),
      ),
    );
  }
}
