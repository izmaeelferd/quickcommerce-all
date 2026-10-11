import 'dart:async';

import 'package:socket_io_client/socket_io_client.dart' as io;

import '../core/env.dart';
import 'storage_service.dart';

/// Real-time channel: order lifecycle, rider location and live config changes.
class SocketService {
  SocketService._();
  static final SocketService instance = SocketService._();

  io.Socket? _socket;
  final _events = StreamController<({String event, dynamic data})>.broadcast();
  Stream<({String event, dynamic data})> get events => _events.stream;

  Stream<dynamic> on(String event) => _events.stream.where((e) => e.event == event).map((e) => e.data);

  static const _forwarded = [
    'order:new',
    'order:accepted',
    'order:status-update',
    'delivery:location',
    'delivery:assigned',
    'delivery:available',
    'delivery:taken',
    'config:updated',
    'notification:new',
  ];

  void connect() {
    disconnect();
    final token = StorageService.instance.accessToken;
    _socket = io.io(
      Env.apiBaseUrl,
      io.OptionBuilder().setTransports(['websocket']).enableReconnection().setAuth({if (token != null) 'token': token}).disableAutoConnect().build(),
    );
    for (final e in _forwarded) {
      _socket!.on(e, (data) => _events.add((event: e, data: data)));
    }
    _socket!.connect();
  }

  void reconnectWithAuth() => connect();

  void joinOrder(String orderId) => _socket?.emitWithAck('order:join', {'orderId': orderId}, ack: (_) {});
  void leaveOrder(String orderId) => _socket?.emit('order:leave', {'orderId': orderId});
  void setDeliveryOnline(bool online) => _socket?.emit('delivery:online', {'online': online});
  void sendLocation(double lat, double lng, {double? heading, double? speed}) =>
      _socket?.emit('delivery:location', {'lat': lat, 'lng': lng, 'heading': heading, 'speed': speed});

  void disconnect() {
    _socket?.dispose();
    _socket = null;
  }
}
