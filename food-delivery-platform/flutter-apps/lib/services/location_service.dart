import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

import '../core/env.dart';

class LocationService {
  LocationService._();
  static final LocationService instance = LocationService._();

  Position? last;

  Future<bool> ensurePermission() async {
    if (!await Geolocator.isLocationServiceEnabled()) return false;
    var p = await Geolocator.checkPermission();
    if (p == LocationPermission.denied) p = await Geolocator.requestPermission();
    return p == LocationPermission.always || p == LocationPermission.whileInUse;
  }

  Future<Position?> current() async {
    try {
      if (!await ensurePermission()) return null;
      last = await Geolocator.getCurrentPosition(locationSettings: const LocationSettings(accuracy: LocationAccuracy.high));
      return last;
    } catch (_) {
      return null;
    }
  }

  /// [background] keeps updates flowing while the app is backgrounded (Rider app while online):
  /// an Android location foreground service with a persistent notification, and iOS background
  /// updates when the Rider target declares the `location` background mode.
  Stream<Position> stream({int distanceFilter = 15, bool background = false, String? notificationTitle, String? notificationText}) {
    if (background && defaultTargetPlatform == TargetPlatform.android) {
      return Geolocator.getPositionStream(
        locationSettings: AndroidSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: distanceFilter,
          foregroundNotificationConfig: ForegroundNotificationConfig(
            notificationTitle: notificationTitle ?? '',
            notificationText: notificationText ?? '',
            enableWakeLock: true,
            setOngoing: true,
          ),
        ),
      );
    }
    if (background && defaultTargetPlatform == TargetPlatform.iOS && Env.iosBackgroundLocation) {
      return Geolocator.getPositionStream(
        locationSettings: AppleSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: distanceFilter,
          activityType: ActivityType.automotiveNavigation,
          pauseLocationUpdatesAutomatically: false,
          allowBackgroundLocationUpdates: true,
          showBackgroundLocationIndicator: true,
        ),
      );
    }
    return Geolocator.getPositionStream(locationSettings: LocationSettings(accuracy: LocationAccuracy.high, distanceFilter: distanceFilter));
  }
}
