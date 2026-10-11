import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/formatters.dart';
import '../../core/translation_manager.dart';
import '../../models/json_utils.dart';
import '../../providers/config_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/common/cards.dart';
import '../../widgets/common/states.dart';

final referralProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) => ApiService.instance.referral());

/// Bonus amounts come from businessRules.referralBonus / refereeBonus.
class ReferralScreen extends ConsumerWidget {
  const ReferralScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(referralProvider);
    final appName = ref.watch(appConfigProvider).branding.appName;
    return Scaffold(
      appBar: AppBar(title: Text(tr('profile.referral'))),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(error: e, onRetry: () => ref.invalidate(referralProvider)),
        data: (d) {
          final code = toStr(d['referralCode']);
          final bonus = Fmt.money(toDouble(d['referralBonus']));
          final friendBonus = Fmt.money(toDouble(d['refereeBonus']));
          return ListView(padding: const EdgeInsets.all(20), children: [
            Icon(Icons.card_giftcard, size: 96, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 16),
            Text(tr('referral.headline', {'bonus': bonus}),
                textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
            const SizedBox(height: 8),
            Text(tr('referral.description', {'bonus': bonus, 'friendBonus': friendBonus, 'app': appName}), textAlign: TextAlign.center),
            const SizedBox(height: 24),
            AppCard(
              child: Row(children: [
                Expanded(child: Text(code, style: Theme.of(context).textTheme.headlineSmall?.copyWith(letterSpacing: 3, fontWeight: FontWeight.w800))),
                IconButton(
                  icon: const Icon(Icons.copy),
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: tr('referral.shareText', {'code': code, 'app': appName, 'bonus': friendBonus})));
                    showMessage(context, 'referral.copied');
                  },
                ),
              ]),
            ),
            const SizedBox(height: 20),
            Row(children: [
              Expanded(
                  child: AppCard(
                      child: Column(
                          children: [Text('${toInt(d['referredCount'])}', style: Theme.of(context).textTheme.headlineSmall), Text(tr('referral.friends'))]))),
              const SizedBox(width: 12),
              Expanded(
                  child: AppCard(
                      child: Column(children: [
                Text(Fmt.money(toDouble(d['totalEarned'])), style: Theme.of(context).textTheme.headlineSmall),
                Text(tr('referral.earned'))
              ]))),
            ]),
          ]);
        },
      ),
    );
  }
}
