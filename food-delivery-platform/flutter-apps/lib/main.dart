import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/api_client.dart';
import 'core/dynamic_theme.dart';
import 'core/env.dart';
import 'core/routes.dart';
import 'core/translation_manager.dart';
import 'providers/config_provider.dart';
import 'screens/shared/splash_screen.dart';
import 'services/notification_service.dart';
import 'services/socket_service.dart';
import 'services/storage_service.dart';

final navigatorKey = GlobalKey<NavigatorState>();

/// Shared bootstrap for all flavors. Flavor entrypoints call this with their flavor.
Future<void> bootstrap(AppFlavor flavor) async {
  WidgetsFlutterBinding.ensureInitialized();
  Env.flavor = flavor;
  await StorageService.instance.init();
  SocketService.instance.connect();
  // Push setup must never block startup (e.g. Firebase not configured or unreachable).
  unawaited(NotificationService.instance.init(channelName: flavor.name).timeout(const Duration(seconds: 8), onTimeout: () {}).catchError((_) {}));
  runApp(const ProviderScope(child: FoodApp()));
}

Future<void> main() => bootstrap(Env.flavor);

class FoodApp extends ConsumerStatefulWidget {
  const FoodApp({super.key});

  @override
  ConsumerState<FoodApp> createState() => _FoodAppState();
}

class _FoodAppState extends ConsumerState<FoodApp> {
  StreamSubscription? _maintenanceSub;
  StreamSubscription? _tapSub;

  @override
  void initState() {
    super.initState();
    _maintenanceSub = ApiClient.instance.onMaintenance.listen((_) async {
      await ref.read(configProvider.notifier).load(silent: true);
      navigatorKey.currentState?.pushNamedAndRemoveUntil(Routes.maintenance, (_) => false);
    });
    _tapSub = NotificationService.instance.onTap.listen((data) {
      final orderId = data['orderId'] ?? data['payload'];
      if (orderId == null || orderId.toString().isEmpty) return;
      final route = switch (Env.flavor) {
        AppFlavor.customer => Routes.tracking,
        AppFlavor.vendor => Routes.vendorOrder,
        AppFlavor.delivery => Routes.deliveryOrder,
      };
      navigatorKey.currentState?.pushNamed(route, arguments: orderId.toString());
    });
  }

  @override
  void dispose() {
    _maintenanceSub?.cancel();
    _tapSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(configProvider);
    final cfg = state.config;
    final title = switch (Env.flavor) {
      AppFlavor.customer => cfg.branding.appName,
      AppFlavor.vendor => cfg.branding.vendorAppName,
      AppFlavor.delivery => cfg.branding.deliveryAppName,
    };
    return MaterialApp(
      key: ValueKey('app-${state.translationsVersion}'),
      navigatorKey: navigatorKey,
      debugShowCheckedModeBanner: false,
      title: title,
      theme: DynamicTheme.build(cfg.theme, brightness: Brightness.light),
      darkTheme: DynamicTheme.build(cfg.theme, brightness: Brightness.dark),
      themeMode: state.themeMode,
      locale: state.language.isEmpty ? null : Locale(state.language),
      supportedLocales: (cfg.languages.isEmpty ? ['en'] : cfg.languages).map((c) => Locale(c)),
      localizationsDelegates: const [GlobalMaterialLocalizations.delegate, GlobalWidgetsLocalizations.delegate, GlobalCupertinoLocalizations.delegate],
      localeResolutionCallback: (locale, supported) => supported.firstWhere((l) => l.languageCode == locale?.languageCode, orElse: () => const Locale('en')),
      builder: (context, child) {
        final media = MediaQuery.of(context);
        return Directionality(
          textDirection: TranslationManager.instance.direction,
          child: MediaQuery(data: media.copyWith(textScaler: TextScaler.linear(cfg.theme.appFontScale)), child: child ?? const SizedBox.shrink()),
        );
      },
      home: const SplashScreen(),
      onGenerateRoute: Routes.generate,
    );
  }
}
