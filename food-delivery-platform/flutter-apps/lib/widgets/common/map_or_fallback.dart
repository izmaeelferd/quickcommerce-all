import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/env.dart';
import '../../core/translation_manager.dart';

/// Renders [map] where Google Maps is available. Web builds without GOOGLE_MAPS_KEY (the Maps
/// JavaScript API is not loaded) get a card that opens the location in the Maps website instead.
class MapOrFallback extends StatelessWidget {
  final LatLng target;
  final Widget Function() map;
  const MapOrFallback({super.key, required this.target, required this.map});

  static bool get available => !kIsWeb || Env.googleMapsKey.isNotEmpty;

  @override
  Widget build(BuildContext context) {
    if (available) return map();
    final scheme = Theme.of(context).colorScheme;
    return Container(
      color: scheme.surfaceContainerHighest,
      alignment: Alignment.center,
      padding: const EdgeInsets.all(16),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.map_outlined, size: 40, color: scheme.primary),
        const SizedBox(height: 8),
        Text(tr('map.unavailable'), textAlign: TextAlign.center),
        const SizedBox(height: 8),
        OutlinedButton.icon(
          icon: const Icon(Icons.open_in_new),
          label: Text(tr('map.openInMaps')),
          onPressed: () => launchUrl(
            Uri.parse('https://www.google.com/maps/search/?api=1&query=${target.latitude},${target.longitude}'),
            mode: LaunchMode.externalApplication,
          ),
        ),
      ]),
    );
  }
}
