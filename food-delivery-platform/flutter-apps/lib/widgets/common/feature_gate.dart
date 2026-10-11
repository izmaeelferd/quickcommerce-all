import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/config_provider.dart';

/// Renders [child] only when the remote feature flag [feature] is on.
class FeatureGate extends ConsumerWidget {
  final String feature;
  final Widget child;
  final Widget fallback;
  const FeatureGate({super.key, required this.feature, required this.child, this.fallback = const SizedBox.shrink()});

  @override
  Widget build(BuildContext context, WidgetRef ref) => ref.watch(featureProvider(feature)) ? child : fallback;
}
