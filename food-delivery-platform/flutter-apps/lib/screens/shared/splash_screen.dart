import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/dynamic_theme.dart';
import '../../core/env.dart';
import '../../core/routes.dart';
import '../../core/translation_manager.dart';
import '../../providers/auth_provider.dart';
import '../../providers/config_provider.dart';
import '../../services/location_service.dart';
import '../../services/storage_service.dart';
import '../../widgets/common/cards.dart';
import '../../widgets/common/states.dart';

/// Logo, background and duration all come from config.theme.
class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});
  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _start());
  }

  int _cmp(String a, String b) {
    final pa = a.split('.').map((e) => int.tryParse(e) ?? 0).toList();
    final pb = b.split('.').map((e) => int.tryParse(e) ?? 0).toList();
    for (var i = 0; i < 3; i++) {
      final x = i < pa.length ? pa[i] : 0;
      final y = i < pb.length ? pb[i] : 0;
      if (x != y) return x.compareTo(y);
    }
    return 0;
  }

  Future<void> _start() async {
    setState(() => _failed = false);
    final started = DateTime.now();
    await ref.read(configProvider.notifier).load();
    final state = ref.read(configProvider);
    if (!state.loaded) {
      setState(() => _failed = true);
      return;
    }
    final cfg = state.config;
    if (Env.flavor == AppFlavor.customer) LocationService.instance.current();
    await ref.read(authProvider.notifier).bootstrap();

    final elapsed = DateTime.now().difference(started).inMilliseconds;
    final wait = cfg.theme.splashDuration - elapsed;
    if (wait > 0) await Future.delayed(Duration(milliseconds: wait));
    if (!mounted) return;

    if (cfg.maintenance.affects(Env.appType)) {
      Navigator.pushReplacementNamed(context, Routes.maintenance);
      return;
    }
    final versionInfo = cfg.appVersions[Env.appType];
    if (versionInfo != null) {
      final info = await PackageInfo.fromPlatform();
      if (_cmp(info.version, versionInfo.minVersion) < 0) {
        await _forceUpdate(versionInfo.storeUrlAndroid, versionInfo.storeUrlIos, versionInfo.forceUpdate);
        if (versionInfo.forceUpdate) return;
      }
    }
    if (!mounted) return;
    final auth = ref.read(authProvider);
    final storage = StorageService.instance;
    if (Env.flavor == AppFlavor.customer && cfg.feature('onboarding') && cfg.onboardingEnabled && cfg.onboardingPages.isNotEmpty && !storage.onboardingDone) {
      Navigator.pushReplacementNamed(context, Routes.onboarding);
    } else if (auth.isLoggedIn) {
      Navigator.pushReplacementNamed(context, Routes.homeForFlavor);
    } else {
      Navigator.pushReplacementNamed(context, Routes.login);
    }
  }

  Future<void> _forceUpdate(String android, String ios, bool force) async {
    await showDialog(
      context: context,
      barrierDismissible: !force,
      builder: (c) => PopScope(
        canPop: !force,
        child: AlertDialog(
          title: Text(tr('update.title')),
          content: Text(tr('update.message')),
          actions: [
            if (!force) TextButton(onPressed: () => Navigator.pop(c), child: Text(tr('common.later'))),
            FilledButton(
              onPressed: () {
                final url = Theme.of(c).platform == TargetPlatform.iOS ? ios : android;
                if (url.isNotEmpty) launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
              },
              child: Text(tr('update.action')),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cfg = ref.watch(appConfigProvider);
    final bg = hexColor(cfg.theme.splashBackgroundColor, Theme.of(context).colorScheme.primary);
    final onBg = ThemeData.estimateBrightnessForColor(bg) == Brightness.dark ? Theme.of(context).colorScheme.surface : Theme.of(context).colorScheme.onSurface;
    final name = switch (Env.flavor) {
      AppFlavor.customer => cfg.branding.appName,
      AppFlavor.vendor => cfg.branding.vendorAppName,
      AppFlavor.delivery => cfg.branding.deliveryAppName,
    };
    return Scaffold(
      backgroundColor: bg,
      body: Center(
        child: _failed
            ? ErrorView(error: Exception(), onRetry: _start)
            : Column(mainAxisSize: MainAxisSize.min, children: [
                if (cfg.theme.splashLogoUrl.isNotEmpty) NetImage(cfg.theme.splashLogoUrl, width: 140, height: 140, fit: BoxFit.contain),
                const SizedBox(height: 16),
                if (name.isNotEmpty) Text(name, style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: onBg, fontWeight: FontWeight.w800)),
                if (cfg.branding.appTagline.isNotEmpty && Env.flavor == AppFlavor.customer)
                  Padding(padding: const EdgeInsets.only(top: 6), child: Text(cfg.branding.appTagline, style: TextStyle(color: onBg))),
                const SizedBox(height: 32),
                SizedBox(width: 28, height: 28, child: CircularProgressIndicator(strokeWidth: 2.5, color: onBg)),
              ]),
      ),
    );
  }
}
