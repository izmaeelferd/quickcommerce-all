import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import 'api_service.dart';

@pragma('vm:entry-point')
Future<void> firebaseBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
}

/// FCM + local notifications. Safe to call when Firebase is not configured.
class NotificationService {
  NotificationService._();
  static final NotificationService instance = NotificationService._();

  final _local = FlutterLocalNotificationsPlugin();
  final _taps = StreamController<Map<String, dynamic>>.broadcast();
  Stream<Map<String, dynamic>> get onTap => _taps.stream;
  bool _ready = false;
  final _initDone = Completer<void>();
  String? token;

  Future<void> init({required String channelName}) async {
    try {
      await Firebase.initializeApp();
      FirebaseMessaging.onBackgroundMessage(firebaseBackgroundHandler);
      const android = AndroidInitializationSettings('@mipmap/ic_launcher');
      const ios = DarwinInitializationSettings();
      await _local.initialize(const InitializationSettings(android: android, iOS: ios), onDidReceiveNotificationResponse: (r) {
        _taps.add({'payload': r.payload});
      });
      await _local
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(AndroidNotificationChannel('default', channelName, importance: Importance.high));
      FirebaseMessaging.onMessage.listen((m) => _showLocal(m, channelName));
      FirebaseMessaging.onMessageOpenedApp.listen((m) => _taps.add(m.data));
      final initial = await FirebaseMessaging.instance.getInitialMessage();
      if (initial != null) _taps.add(initial.data);
      _ready = true;
    } catch (e) {
      debugPrint('[push] firebase not configured: $e');
    } finally {
      if (!_initDone.isCompleted) _initDone.complete();
    }
  }

  Future<void> registerToken() async {
    if (!_ready) await _initDone.future.timeout(const Duration(seconds: 10), onTimeout: () {});
    if (!_ready) return;
    try {
      await FirebaseMessaging.instance.requestPermission();
      token = await FirebaseMessaging.instance.getToken();
      if (token != null) await ApiService.instance.registerFcmToken(token!);
      FirebaseMessaging.instance.onTokenRefresh.listen((t) {
        token = t;
        ApiService.instance.registerFcmToken(t);
      });
    } catch (e) {
      debugPrint('[push] token error: $e');
    }
  }

  Future<void> _showLocal(RemoteMessage m, String channelName) async {
    final n = m.notification;
    if (n == null) return;
    await _local.show(
      m.hashCode,
      n.title,
      n.body,
      NotificationDetails(
        android: AndroidNotificationDetails('default', channelName, importance: Importance.high, priority: Priority.high),
        iOS: const DarwinNotificationDetails(),
      ),
      payload: m.data['orderId']?.toString(),
    );
  }
}
