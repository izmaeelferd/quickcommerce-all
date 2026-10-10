import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/translation_manager.dart';
import '../../widgets/common/states.dart';
import '../../widgets/dynamic/offer_card.dart';

class OffersScreen extends ConsumerWidget {
  const OffersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(couponsProvider(null));
    return Scaffold(
      appBar: AppBar(title: Text(tr('profile.offers'))),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(error: e, onRetry: () => ref.invalidate(couponsProvider(null))),
        data: (list) => list.isEmpty
            ? const EmptyState(icon: Icons.local_offer_outlined, titleKey: 'offer.none')
            : ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: list.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (_, i) => OfferCard(coupon: list[i]),
              ),
      ),
    );
  }
}
