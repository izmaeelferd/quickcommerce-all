import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/translation_manager.dart';
import '../../providers/config_provider.dart';
import 'states.dart';

/// Router guard: a screen behind a feature flag renders a "feature disabled" page when
/// the flag is off, even if it is reached through a deep link or notification.
class FeatureRoute extends ConsumerWidget {
  final String feature;
  final Widget child;
  const FeatureRoute({super.key, required this.feature, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (ref.watch(featureProvider(feature))) return child;
    return Scaffold(appBar: AppBar(title: Text(tr('feature.unavailableTitle'))), body: const EmptyState(icon: Icons.block, titleKey: 'feature.disabled'));
  }
}
