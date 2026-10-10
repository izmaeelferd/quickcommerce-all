import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/json_utils.dart';
import '../models/order.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';

final activeOrdersProvider = FutureProvider.autoDispose<List<Order>>((ref) async {
  final sub = SocketService.instance.on('order:status-update').listen((_) => ref.invalidateSelf());
  ref.onDispose(sub.cancel);
  final list = await ApiService.instance.activeOrders();
  return list.map((e) => Order.fromJson(toMap(e))).toList();
});

final orderHistoryProvider = FutureProvider.autoDispose<List<Order>>((ref) async {
  final data = await ApiService.instance.myOrders();
  return toList(data['items']).map((e) => Order.fromJson(toMap(e))).toList();
});

class TrackingState {
  final Order? order;
  final double? riderLat;
  final double? riderLng;
  final Object? error;
  const TrackingState({this.order, this.riderLat, this.riderLng, this.error});
  TrackingState copyWith({Order? order, double? riderLat, double? riderLng, Object? error}) =>
      TrackingState(order: order ?? this.order, riderLat: riderLat ?? this.riderLat, riderLng: riderLng ?? this.riderLng, error: error ?? this.error);
}

/// Live order: REST snapshot + socket status/location updates.
class OrderTracker extends StateNotifier<TrackingState> {
  OrderTracker(this.orderId) : super(const TrackingState()) {
    _load();
    SocketService.instance.joinOrder(orderId);
    _subs.add(SocketService.instance.on('order:status-update').listen((d) {
      if (toStr(toMap(d)['orderId']) == orderId) _load();
    }));
    _subs.add(SocketService.instance.on('delivery:assigned').listen((d) {
      if (toStr(toMap(d)['orderId']) == orderId) _load();
    }));
    _subs.add(SocketService.instance.on('delivery:location').listen((d) {
      final m = toMap(d);
      if (toStr(m['orderId']) == orderId) state = state.copyWith(riderLat: toDouble(m['lat']), riderLng: toDouble(m['lng']));
    }));
  }

  final String orderId;
  final List<StreamSubscription> _subs = [];

  Future<void> _load() async {
    try {
      state = state.copyWith(order: Order.fromJson(await ApiService.instance.order(orderId)));
    } catch (e) {
      state = state.copyWith(error: e);
    }
  }

  Future<void> refresh() => _load();

  Future<void> cancel(String reason) async {
    await ApiService.instance.cancelOrder(orderId, reason);
    await _load();
  }

  @override
  void dispose() {
    for (final s in _subs) {
      s.cancel();
    }
    SocketService.instance.leaveOrder(orderId);
    super.dispose();
  }
}

final orderTrackerProvider = StateNotifierProvider.autoDispose.family<OrderTracker, TrackingState, String>((ref, id) => OrderTracker(id));
