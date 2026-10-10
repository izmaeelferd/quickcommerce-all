import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/routes.dart';
import '../../core/translation_manager.dart';
import '../../providers/auth_provider.dart';
import '../../providers/config_provider.dart';
import '../../services/storage_service.dart';
import '../../widgets/common/cards.dart';

/// Pages (title, description, image) come from config.onboarding.
class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});
  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends ConsumerState<OnboardingScreen> {
  final _controller = PageController();
  int _index = 0;

  Future<void> _finish() async {
    await StorageService.instance.setOnboardingDone();
    if (!mounted) return;
    Navigator.pushReplacementNamed(context, ref.read(authProvider).isLoggedIn ? Routes.home : Routes.login);
  }

  @override
  Widget build(BuildContext context) {
    final pages = ref.watch(appConfigProvider).onboardingPages;
    final scheme = Theme.of(context).colorScheme;
    final last = _index >= pages.length - 1;
    return Scaffold(
      body: SafeArea(
        child: Column(children: [
          Align(alignment: AlignmentDirectional.centerEnd, child: TextButton(onPressed: _finish, child: Text(tr('common.skip')))),
          Expanded(
            child: PageView.builder(
              controller: _controller,
              itemCount: pages.length,
              onPageChanged: (i) => setState(() => _index = i),
              itemBuilder: (_, i) {
                final p = pages[i];
                return Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Expanded(
                        child: p.imageUrl.isEmpty ? Icon(Icons.delivery_dining, size: 160, color: scheme.primary) : NetImage(p.imageUrl, fit: BoxFit.contain)),
                    const SizedBox(height: 24),
                    Text(p.title, textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
                    const SizedBox(height: 12),
                    Text(p.description, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyLarge),
                  ]),
                );
              },
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              pages.length,
              (i) => AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                margin: const EdgeInsets.all(4),
                width: i == _index ? 22 : 8,
                height: 8,
                decoration: BoxDecoration(color: i == _index ? scheme.primary : scheme.outlineVariant, borderRadius: BorderRadius.circular(4)),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: ElevatedButton(
              onPressed: last ? _finish : () => _controller.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeOut),
              child: Text(tr(last ? 'onboarding.getStarted' : 'common.next')),
            ),
          ),
        ]),
      ),
    );
  }
}
