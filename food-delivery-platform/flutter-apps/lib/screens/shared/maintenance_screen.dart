import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/env.dart';
import '../../core/routes.dart';
import '../../core/translation_manager.dart';
import '../../providers/config_provider.dart';
import '../../widgets/common/cards.dart';

/// Shown when config.maintenance.appInMaintenance is true for this app type.
class MaintenanceScreen extends ConsumerWidget {
  const MaintenanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cfg = ref.watch(appConfigProvider);
    final m = cfg.maintenance;
    if (!m.affects(Env.appType) && ref.watch(configProvider).loaded) {
      WidgetsBinding.instance.addPostFrameCallback((_) => Navigator.of(context).pushNamedAndRemoveUntil(Routes.login, (_) => false));
    }
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              if (m.imageUrl.isNotEmpty)
                NetImage(m.imageUrl, height: 180, fit: BoxFit.contain)
              else
                Icon(Icons.build_circle_outlined, size: 96, color: Theme.of(context).colorScheme.primary),
              const SizedBox(height: 24),
              Text(tr('maintenance.title'), style: Theme.of(context).textTheme.headlineSmall, textAlign: TextAlign.center),
              const SizedBox(height: 12),
              Text(m.message.isNotEmpty ? m.message : tr('maintenance.defaultMessage'), textAlign: TextAlign.center),
              const SizedBox(height: 24),
              OutlinedButton.icon(
                onPressed: () => ref.read(configProvider.notifier).load(),
                icon: const Icon(Icons.refresh),
                label: Text(tr('common.retry')),
              ),
            ]),
          ),
        ),
      ),
    );
  }
}
