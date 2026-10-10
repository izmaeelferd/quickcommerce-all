import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/formatters.dart';
import '../../core/translation_manager.dart';
import '../../models/app_notification.dart';
import '../../models/json_utils.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';
import '../../services/payment_service.dart';
import '../../widgets/common/cards.dart';
import '../../widgets/common/states.dart';

final walletProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) => ApiService.instance.wallet());

class WalletScreen extends ConsumerWidget {
  const WalletScreen({super.key});

  Future<void> _topUp(BuildContext context, WidgetRef ref) async {
    final ctrl = TextEditingController();
    final amount = await showDialog<double>(
      context: context,
      builder: (c) => AlertDialog(
        title: Text(tr('wallet.addMoney')),
        content: TextField(
            controller: ctrl, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: InputDecoration(labelText: tr('wallet.amount'))),
        actions: [
          TextButton(onPressed: () => Navigator.pop(c), child: Text(tr('common.cancel'))),
          FilledButton(onPressed: () => Navigator.pop(c, double.tryParse(ctrl.text)), child: Text(tr('common.continue'))),
        ],
      ),
    );
    if (amount == null || amount <= 0) return;
    try {
      final ok = await PaymentService().topUpWallet(amount);
      if (context.mounted) showMessage(context, ok ? 'wallet.toppedUp' : 'payment.failed');
      ref.invalidate(walletProvider);
      ref.read(authProvider.notifier).refresh();
    } catch (e) {
      if (context.mounted) showError(context, e);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(walletProvider);
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: Text(tr('profile.wallet'))),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(error: e, onRetry: () => ref.invalidate(walletProvider)),
        data: (d) {
          final txns = toList(d['items']).map((e) => WalletTxn.fromJson(toMap(e))).toList();
          return ListView(padding: const EdgeInsets.all(16), children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: scheme.primary, borderRadius: BorderRadius.circular(16)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(tr('wallet.balance'), style: TextStyle(color: scheme.onPrimary)),
                const SizedBox(height: 6),
                Text(Fmt.money(toDouble(d['balance'])),
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: scheme.onPrimary, fontWeight: FontWeight.w800)),
                const SizedBox(height: 6),
                Text(tr('wallet.maxUse', {'percent': toDouble(d['maxUsePercent']).toStringAsFixed(0)}), style: TextStyle(color: scheme.onPrimary)),
                const SizedBox(height: 12),
                FilledButton.tonal(onPressed: () => _topUp(context, ref), child: Text(tr('wallet.addMoney'))),
              ]),
            ),
            const SizedBox(height: 20),
            Text(tr('wallet.history'), style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            if (txns.isEmpty) const EmptyState(icon: Icons.receipt_outlined, titleKey: 'wallet.noTransactions'),
            for (final t in txns)
              AppCard(
                padding: EdgeInsets.zero,
                child: ListTile(
                  leading:
                      Icon(t.direction == 'credit' ? Icons.arrow_downward : Icons.arrow_upward, color: t.direction == 'credit' ? scheme.primary : scheme.error),
                  title: Text(tr('txn.${t.type}')),
                  subtitle: Text(Fmt.dateTime(t.createdAt)),
                  trailing: Text('${t.direction == 'credit' ? '+' : '-'}${Fmt.money(t.amount)}', style: const TextStyle(fontWeight: FontWeight.w700)),
                ),
              ),
          ]);
        },
      ),
    );
  }
}
