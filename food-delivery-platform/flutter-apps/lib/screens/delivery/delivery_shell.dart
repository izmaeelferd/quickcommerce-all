import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

import '../../core/translation_manager.dart';
import '../../providers/auth_provider.dart';
import '../../services/location_service.dart';
import '../../services/socket_service.dart';
import '../../widgets/common/states.dart';
import 'delivery_screens.dart';

class DeliveryShell extends ConsumerStatefulWidget {
  const DeliveryShell({super.key});
  @override
  ConsumerState<DeliveryShell> createState() => _DeliveryShellState();
}

class _DeliveryShellState extends ConsumerState<DeliveryShell> {
  int _tab = 0;
  StreamSubscription<Position>? _loc;
  final List<StreamSubscription> _subs = [];

  @override
  void initState() {
    super.initState();
    _subs.add(SocketService.instance.on('delivery:available').listen((_) {
      ref.invalidate(availableOrdersProvider);
      if (mounted) showMessage(context, 'delivery.newRequest');
    }));
    _subs.add(SocketService.instance.on('delivery:taken').listen((_) => ref.invalidate(availableOrdersProvider)));
    _subs.add(SocketService.instance.on('delivery:assigned').listen((_) => ref.invalidate(activeDeliveryProvider)));
  }

  /// Streams GPS to the backend while the partner is online.
  void _syncTracking(bool online) {
    if (online && _loc == null) {
      _loc = LocationService.instance.stream().listen((p) => SocketService.instance.sendLocation(p.latitude, p.longitude, heading: p.heading, speed: p.speed));
    } else if (!online && _loc != null) {
      _loc!.cancel();
      _loc = null;
    }
  }

  @override
  void dispose() {
    _loc?.cancel();
    for (final s in _subs) {
      s.cancel();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    if (auth.deliveryProfile == null ||
        auth.deliveryStatus == '' ||
        (auth.deliveryStatus == 'pending' && (auth.deliveryProfile?['vehicleNumber'] ?? '') == '')) {
      return const DeliveryProfileScreen(onboarding: true);
    }
    _syncTracking(auth.deliveryOnline && auth.deliveryStatus == 'approved');
    final tabs = const [DeliveryHomeTab(), DeliveryEarningsScreen(embedded: true), DeliveryHistoryScreen(embedded: true), DeliveryMoreTab()];
    return Scaffold(
      body: IndexedStack(index: _tab, children: tabs),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() => _tab = i),
        destinations: [
          NavigationDestination(icon: const Icon(Icons.delivery_dining_outlined), label: tr('delivery.nav.home')),
          NavigationDestination(icon: const Icon(Icons.payments_outlined), label: tr('delivery.nav.earnings')),
          NavigationDestination(icon: const Icon(Icons.history), label: tr('delivery.nav.history')),
          NavigationDestination(icon: const Icon(Icons.more_horiz), label: tr('delivery.nav.more')),
        ],
      ),
    );
  }
}
