import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/formatters.dart';
import '../../core/routes.dart';
import '../../core/translation_manager.dart';
import '../../models/json_utils.dart';
import '../../models/order.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/config_provider.dart';
import '../../services/api_service.dart';
import '../../services/payment_service.dart';
import '../../widgets/common/buttons.dart';
import '../../widgets/common/cards.dart';
import '../../widgets/common/states.dart';
import 'cart_screen.dart';

const _methodIcons = {
  'card': Icons.credit_card,
  'upi': Icons.qr_code_2,
  'wallet': Icons.account_balance_wallet_outlined,
  'cod': Icons.payments_outlined,
  'netbanking': Icons.account_balance_outlined,
};

/// Payment methods listed come only from businessRules.paymentMethods (+ wallet flag).
class PaymentScreen extends ConsumerStatefulWidget {
  const PaymentScreen({super.key});
  @override
  ConsumerState<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends ConsumerState<PaymentScreen> {
  String? _method;
  bool _placing = false;

  Future<void> _place() async {
    if (_method == null) return;
    setState(() => _placing = true);
    final cart = ref.read(cartProvider);
    final co = ref.read(checkoutProvider);
    try {
      final res = await ApiService.instance.placeOrder({...orderBody(cart, co), 'paymentMethod': _method});
      final order = toMap(res['order']);
      final orderId = toStr(order['_id']);
      if (toBool(res['requiresPayment'])) {
        final paid = await PaymentService().payForOrder(orderId);
        if (!paid) {
          if (mounted) showMessage(context, 'payment.failed');
          if (mounted) Navigator.of(context).pushNamedAndRemoveUntil(Routes.tracking, (r) => r.settings.name == Routes.home || r.isFirst, arguments: orderId);
          ref.read(cartProvider.notifier).clear();
          return;
        }
      }
      ref.read(cartProvider.notifier).clear();
      ref.read(checkoutProvider.notifier).state = CheckoutOptions(addressId: co.addressId);
      ref.read(authProvider.notifier).refresh();
      if (mounted) {
        Navigator.of(context).pushNamedAndRemoveUntil(Routes.orderConfirmation, (r) => r.settings.name == Routes.home || r.isFirst, arguments: orderId);
      }
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _placing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cfg = ref.watch(appConfigProvider);
    final rules = cfg.businessRules;
    final quote = ref.watch(quoteProvider).valueOrNull;
    final bill = quote == null ? null : Bill(toMap(quote['bill']));
    final user = ref.watch(authProvider).user;
    final methods = rules.enabledPaymentMethods.where((m) => m != 'wallet' || cfg.feature('wallet')).toList();
    return Scaffold(
      appBar: AppBar(title: Text(tr('payment.title'))),
      body: bill == null
          ? const LoadingView()
          : ListView(padding: const EdgeInsets.all(16), children: [
              AppCard(
                child: Row(children: [
                  Expanded(child: Text(tr('payment.amountToPay'), style: Theme.of(context).textTheme.titleMedium)),
                  Text(Fmt.money(bill.payable), style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
                ]),
              ),
              const SizedBox(height: 16),
              RadioGroup<String>(
                groupValue: _method,
                onChanged: (v) => setState(() => _method = v),
                child: Column(children: [for (final m in methods) _methodTile(m, bill, rules.codMaxAmount, user?.walletBalance ?? 0)]),
              ),
              if (methods.isEmpty) const EmptyState(icon: Icons.money_off, titleKey: 'payment.noMethods'),
            ]),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: AppButton(labelKey: 'payment.placeOrder', loading: _placing, onPressed: _method == null || bill == null ? null : _place),
        ),
      ),
    );
  }

  Widget _methodTile(String m, Bill bill, double codMax, double walletBalance) {
    String? disabledReason;
    if (m == 'cod' && codMax > 0 && bill.payable > codMax) disabledReason = tr('payment.codLimit', {'amount': Fmt.money(codMax)});
    if (m == 'wallet' && walletBalance < bill.total) disabledReason = tr('payment.walletInsufficient', {'balance': Fmt.money(walletBalance)});
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: AppCard(
        padding: EdgeInsets.zero,
        child: RadioListTile<String>(
          value: m,
          enabled: disabledReason == null,
          secondary: Icon(_methodIcons[m] ?? Icons.payment),
          title: Text(tr('payment.method.$m')),
          subtitle: disabledReason != null ? Text(disabledReason) : null,
        ),
      ),
    );
  }
}
