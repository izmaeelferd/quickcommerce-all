import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/translation_manager.dart';
import '../../providers/auth_provider.dart';
import '../../services/socket_service.dart';
import '../../widgets/common/states.dart';
import 'vendor_menu_screens.dart';
import 'vendor_order_screens.dart';
import 'vendor_settings_screens.dart';

class VendorShell extends ConsumerStatefulWidget {
  const VendorShell({super.key});
  @override
  ConsumerState<VendorShell> createState() => _VendorShellState();
}

class _VendorShellState extends ConsumerState<VendorShell> {
  int _tab = 0;
  StreamSubscription? _sub;

  @override
  void initState() {
    super.initState();
    _sub = SocketService.instance.on('order:new').listen((_) {
      ref.invalidate(vendorOrdersProvider);
      ref.invalidate(vendorStatsProvider);
      if (mounted) showMessage(context, 'vendor.newOrderAlert');
    });
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    if (auth.restaurant == null) return const VendorRestaurantProfileScreen(onboarding: true);
    final tabs = const [VendorDashboardTab(), VendorOrdersTab(), VendorMenuTab(), VendorMoreTab()];
    return Scaffold(
      body: IndexedStack(index: _tab, children: tabs),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() => _tab = i),
        destinations: [
          NavigationDestination(icon: const Icon(Icons.dashboard_outlined), label: tr('vendor.nav.dashboard')),
          NavigationDestination(icon: const Icon(Icons.receipt_long_outlined), label: tr('vendor.nav.orders')),
          NavigationDestination(icon: const Icon(Icons.restaurant_menu), label: tr('vendor.nav.menu')),
          NavigationDestination(icon: const Icon(Icons.more_horiz), label: tr('vendor.nav.more')),
        ],
      ),
    );
  }
}
