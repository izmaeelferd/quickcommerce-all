import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/dynamic_theme.dart';
import '../../core/formatters.dart';
import '../../core/routes.dart';
import '../../core/translation_manager.dart';
import '../../providers/order_provider.dart';
import '../../widgets/common/buttons.dart';
import '../../widgets/common/states.dart';

class OrderConfirmationScreen extends ConsumerWidget {
  final String orderId;
  const OrderConfirmationScreen({super.key, required this.orderId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(orderTrackerProvider(orderId));
    final o = state.order;
    return Scaffold(
      body: SafeArea(
        child: o == null
            ? const LoadingView()
            : Padding(
                padding: const EdgeInsets.all(24),
                child: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
                  Icon(Icons.check_circle, size: 110, color: AppColors.of(context).success),
                  const SizedBox(height: 20),
                  Text(tr('order.placedTitle'),
                      textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  Text(tr('order.placedMessage', {'restaurant': o.restaurant.name, 'number': o.orderNumber}), textAlign: TextAlign.center),
                  const SizedBox(height: 8),
                  Text(tr('order.amount', {'amount': Fmt.money(o.bill.total)}),
                      textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.w700)),
                  if (o.deliveryOtp.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Text(tr('order.deliveryOtp', {'otp': o.deliveryOtp}), textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleMedium),
                  ],
                  const SizedBox(height: 32),
                  AppButton(labelKey: 'order.track', onPressed: () => Navigator.pushReplacementNamed(context, Routes.tracking, arguments: orderId)),
                  const SizedBox(height: 10),
                  AppButton(
                      labelKey: 'order.backHome', outlined: true, onPressed: () => Navigator.of(context).pushNamedAndRemoveUntil(Routes.home, (_) => false)),
                ]),
              ),
      ),
    );
  }
}
