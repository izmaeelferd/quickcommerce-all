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
import '../../widgets/common/buttons.dart';
import '../../widgets/common/cards.dart';
import '../../widgets/common/states.dart';
import '../../widgets/dynamic/offer_card.dart';

/// Server-authoritative bill computed from businessRules (/orders/quote).
final quoteProvider = FutureProvider.autoDispose<Map<String, dynamic>?>((ref) async {
  final cart = ref.watch(cartProvider);
  final co = ref.watch(checkoutProvider);
  if (cart.isEmpty) return null;
  return ApiService.instance.quote(orderBody(cart, co));
});

class CartScreen extends ConsumerStatefulWidget {
  const CartScreen({super.key});
  @override
  ConsumerState<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends ConsumerState<CartScreen> {
  final _instructions = TextEditingController();
  final _customTip = TextEditingController();

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    final co = ref.read(checkoutProvider);
    if (co.addressId == null && user?.defaultAddress != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) => ref.read(checkoutProvider.notifier).state = co.copyWith(addressId: user!.defaultAddress!.id));
    }
    _instructions.text = co.instructions;
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);
    final cfg = ref.watch(appConfigProvider);
    final quote = ref.watch(quoteProvider);
    final co = ref.watch(checkoutProvider);
    final user = ref.watch(authProvider).user;
    final address = user?.addresses.where((a) => a.id == co.addressId).firstOrNull;
    final text = Theme.of(context).textTheme;

    if (cart.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: Text(tr('cart.title'))),
        body: EmptyState(
            icon: Icons.shopping_bag_outlined,
            titleKey: 'cart.empty',
            messageKey: 'cart.emptyMessage',
            actionKey: 'cart.browse',
            onAction: () => Navigator.pop(context)),
      );
    }

    final q = quote.valueOrNull;
    final bill = q == null ? null : Bill(toMap(q['bill']));
    final meetsMin = q == null ? true : toBool(q['meetsMinimum'], true);

    return Scaffold(
      appBar: AppBar(title: Text(cart.restaurantName)),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        AppCard(
          child: Column(children: [
            for (final line in cart.items)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(children: [
                  VegBadge(isVeg: line.item.isVeg),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(line.item.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                      if (line.addOns.isNotEmpty) Text(line.addOns.expand((a) => a.options.map((o) => o.name)).join(', '), style: text.bodySmall),
                      Text(Fmt.money(line.lineTotal), style: text.bodySmall),
                    ]),
                  ),
                  QuantityStepper(
                    compact: true,
                    quantity: line.quantity,
                    onAdd: () => ref.read(cartProvider.notifier).setQuantity(line.key, line.quantity + 1),
                    onRemove: () => ref.read(cartProvider.notifier).setQuantity(line.key, line.quantity - 1),
                  ),
                ]),
              ),
            TextField(
              controller: _instructions,
              decoration: InputDecoration(labelText: tr('cart.instructions'), prefixIcon: const Icon(Icons.edit_note)),
              onChanged: (v) => ref.read(checkoutProvider.notifier).state = ref.read(checkoutProvider).copyWith(instructions: v),
            ),
          ]),
        ),
        const SizedBox(height: 12),
        if (cfg.feature('coupons')) _couponTile(q),
        if (cfg.feature('tipping')) ...[const SizedBox(height: 12), _tipCard(cfg.businessRules.tipPresets, cart.tip)],
        if (cfg.feature('wallet') && (user?.walletBalance ?? 0) > 0) ...[
          const SizedBox(height: 12),
          AppCard(
            padding: EdgeInsets.zero,
            child: SwitchListTile(
              value: cart.useWallet,
              onChanged: (v) => ref.read(cartProvider.notifier).setUseWallet(v),
              title: Text(tr('cart.useWallet', {'balance': Fmt.money(user!.walletBalance)})),
              subtitle: Text(tr('cart.walletCap', {'percent': cfg.businessRules.walletMaxUsePercent.toStringAsFixed(0)})),
            ),
          ),
        ],
        if (cfg.feature('scheduleOrder') && cfg.businessRules.deliverySlots.isNotEmpty) ...[
          const SizedBox(height: 12),
          _scheduleCard(cfg.businessRules.deliverySlots, co)
        ],
        const SizedBox(height: 12),
        AppCard(
          child: quote.isLoading && bill == null
              ? const LoadingView()
              : quote.hasError
                  ? ErrorView(error: quote.error!, onRetry: () => ref.invalidate(quoteProvider))
                  : bill == null
                      ? const SizedBox.shrink()
                      : _billBreakdown(bill, cfg.businessRules.taxLabel, q!),
        ),
        const SizedBox(height: 12),
        AppCard(
          onTap: () async {
            await Navigator.pushNamed(context, Routes.addresses, arguments: true);
          },
          child: Row(children: [
            const Icon(Icons.location_on_outlined),
            const SizedBox(width: 10),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(address == null ? tr('cart.selectAddress') : tr('cart.deliverTo', {'label': address.label}),
                    style: const TextStyle(fontWeight: FontWeight.w700)),
                if (address != null) Text(address.fullAddress, maxLines: 2, overflow: TextOverflow.ellipsis, style: text.bodySmall),
              ]),
            ),
            Text(tr(address == null ? 'common.add' : 'common.change')),
          ]),
        ),
        if (!meetsMin)
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Text(tr('cart.minOrder', {'amount': Fmt.money(toDouble(q['minOrderValue']))}), style: TextStyle(color: Theme.of(context).colorScheme.error)),
          ),
        const SizedBox(height: 90),
      ]),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: AppButton(
            labelKey: 'cart.proceed',
            vars: {'total': Fmt.money(bill?.payable ?? cart.subtotal)},
            onPressed: address == null || !meetsMin || bill == null ? null : () => Navigator.pushNamed(context, Routes.payment),
          ),
        ),
      ),
    );
  }

  Widget _couponTile(Map<String, dynamic>? q) {
    final cart = ref.watch(cartProvider);
    final err = q == null ? null : q['couponError'];
    return AppCard(
      padding: EdgeInsets.zero,
      child: ListTile(
        leading: const Icon(Icons.local_offer_outlined),
        title: Text(cart.couponCode == null ? tr('cart.applyCoupon') : tr('cart.couponApplied', {'code': cart.couponCode})),
        subtitle: err != null ? Text(tr(err.toString()), style: TextStyle(color: Theme.of(context).colorScheme.error)) : null,
        trailing: cart.couponCode == null
            ? const Icon(Icons.chevron_right)
            : IconButton(icon: const Icon(Icons.close), onPressed: () => ref.read(cartProvider.notifier).applyCoupon(null)),
        onTap: () => _pickCoupon(),
      ),
    );
  }

  Future<void> _pickCoupon() async {
    final cart = ref.read(cartProvider);
    final ctrl = TextEditingController();
    final code = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      builder: (c) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(c).viewInsets.bottom),
        child: SizedBox(
          height: MediaQuery.of(c).size.height * 0.7,
          child: Column(children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(children: [
                Expanded(
                    child: TextField(
                        controller: ctrl, textCapitalization: TextCapitalization.characters, decoration: InputDecoration(labelText: tr('cart.enterCoupon')))),
                const SizedBox(width: 8),
                FilledButton(onPressed: () => Navigator.pop(c, ctrl.text.trim().toUpperCase()), child: Text(tr('common.apply'))),
              ]),
            ),
            Expanded(
              child: Consumer(builder: (context, ref, _) {
                final async = ref.watch(couponsProvider(cart.restaurantId));
                return async.when(
                  loading: () => const LoadingView(),
                  error: (e, _) => ErrorView(error: e),
                  data: (list) => ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: list.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, i) => OfferCard(coupon: list[i], onApply: () => Navigator.pop(c, list[i].code)),
                  ),
                );
              }),
            ),
          ]),
        ),
      ),
    );
    if (code != null && code.isNotEmpty) ref.read(cartProvider.notifier).applyCoupon(code);
  }

  Widget _tipCard(List<double> presets, double current) {
    final rules = ref.watch(businessRulesProvider);
    return AppCard(
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(tr('cart.tipTitle'), style: const TextStyle(fontWeight: FontWeight.w700)),
        Text(tr('cart.tipSubtitle', {'percent': (rules.deliveryPartnerPayout['tipSharePercent'] ?? 100).toString()}), style: Theme.of(context).textTheme.bodySmall),
        const SizedBox(height: 8),
        Wrap(spacing: 8, children: [
          for (final p in presets)
            ChoiceChip(label: Text(Fmt.money(p)), selected: current == p, onSelected: (s) => ref.read(cartProvider.notifier).setTip(s ? p : 0)),
          ActionChip(
            label: Text(tr('cart.customTip')),
            onPressed: () async {
              final v = await showDialog<double>(
                context: context,
                builder: (c) => AlertDialog(
                  title: Text(tr('cart.customTip')),
                  content: TextField(
                    controller: _customTip,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: InputDecoration(helperText: tr('cart.maxTip', {'percent': rules.maxTipPercent.toStringAsFixed(0)})),
                  ),
                  actions: [FilledButton(onPressed: () => Navigator.pop(c, double.tryParse(_customTip.text)), child: Text(tr('common.apply')))],
                ),
              );
              if (v != null) ref.read(cartProvider.notifier).setTip(v);
            },
          ),
        ]),
      ]),
    );
  }

  Widget _scheduleCard(List slots, CheckoutOptions co) => AppCard(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(tr('cart.deliveryTime'), style: const TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Wrap(spacing: 8, runSpacing: 8, children: [
            ChoiceChip(
                label: Text(tr('cart.asap')),
                selected: co.slotId == null,
                onSelected: (_) => ref.read(checkoutProvider.notifier).state = co.copyWith(clearSchedule: true)),
            for (final s in slots)
              ChoiceChip(
                label: Text(s.label),
                selected: co.slotId == s.id,
                onSelected: (_) {
                  final parts = (s.start as String).split(':');
                  final now = DateTime.now();
                  var at = DateTime(now.year, now.month, now.day, int.tryParse(parts[0]) ?? 0, int.tryParse(parts.length > 1 ? parts[1] : '0') ?? 0);
                  if (at.isBefore(now)) at = at.add(const Duration(days: 1));
                  ref.read(checkoutProvider.notifier).state = co.copyWith(slotId: s.id, scheduledFor: at);
                },
              ),
          ]),
        ]),
      );

  Widget _billBreakdown(Bill b, String taxLabel, Map<String, dynamic> q) {
    Widget row(String key, double v, {Map<String, Object?> vars = const {}, bool bold = false, bool negative = false}) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 3),
          child: Row(children: [
            Expanded(child: Text(tr(key, vars), style: bold ? const TextStyle(fontWeight: FontWeight.w800) : null)),
            Text('${negative ? '-' : ''}${Fmt.money(v)}', style: bold ? const TextStyle(fontWeight: FontWeight.w800) : null),
          ]),
        );
    final rules = ref.watch(businessRulesProvider);
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(tr('cart.billDetails'), style: const TextStyle(fontWeight: FontWeight.w700)),
      const SizedBox(height: 8),
      row('cart.itemTotal', b.subtotal),
      if (b.discount > 0) row('cart.discount', b.discount, negative: true),
      row('cart.deliveryFee', b.deliveryFee, vars: {'km': toDouble(q['distanceKm']).toStringAsFixed(1)}),
      if (b.deliveryFee == 0 && rules.freeDeliveryAbove > 0) Text(tr('cart.freeDeliveryApplied'), style: Theme.of(context).textTheme.bodySmall),
      if (b.surgeFee > 0) row('cart.surgeFee', b.surgeFee, vars: {'reason': rules.surgeReason}),
      if (b.packagingFee > 0) row('cart.packagingFee', b.packagingFee),
      if (b.platformFee > 0) row('cart.platformFee', b.platformFee),
      if (b.tax > 0) row('cart.tax', b.tax, vars: {'label': taxLabel, 'percent': rules.taxPercent.toStringAsFixed(0)}),
      if (b.tip > 0) row('cart.tip', b.tip),
      const Divider(),
      row('cart.total', b.total, bold: true),
      if (b.walletUsed > 0) row('cart.walletUsed', b.walletUsed, negative: true),
      if (b.walletUsed > 0) row('cart.toPay', b.payable, bold: true),
    ]);
  }
}
