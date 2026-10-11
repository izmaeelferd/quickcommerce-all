import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/dynamic_theme.dart';
import '../../core/formatters.dart';
import '../../core/translation_manager.dart';
import '../../models/coupon.dart';
import '../../models/json_utils.dart';
import '../../models/widget_section.dart';
import '../../services/api_service.dart';
import '../common/cards.dart';
import '../common/states.dart';

String couponHeadline(Coupon c) {
  switch (c.discountType) {
    case 'flat':
      return tr('offer.flatOff', {'amount': Fmt.money(c.value)});
    case 'free_delivery':
      return tr('offer.freeDelivery');
    default:
      return c.maxDiscount != null
          ? tr('offer.percentOffUpTo', {'percent': c.value.toStringAsFixed(0), 'max': Fmt.money(c.maxDiscount)})
          : tr('offer.percentOff', {'percent': c.value.toStringAsFixed(0)});
  }
}

class OfferCard extends StatelessWidget {
  final Coupon coupon;
  final VoidCallback? onApply;
  final double? width;
  const OfferCard({super.key, required this.coupon, this.onApply, this.width});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final scheme = Theme.of(context).colorScheme;
    return SizedBox(
      width: width,
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(colors.cardRadius),
          gradient: LinearGradient(colors: [scheme.primary, colors.accent]),
        ),
        padding: const EdgeInsets.all(14),
        child: Row(children: [
          if (coupon.bannerImage.isNotEmpty) ...[NetImage(coupon.bannerImage, width: 48, height: 48, radius: 8), const SizedBox(width: 10)],
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
              Text(couponHeadline(coupon),
                  maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: scheme.onPrimary, fontWeight: FontWeight.w800, fontSize: 16)),
              if (coupon.title.isNotEmpty || coupon.restaurantName.isNotEmpty)
                Text(coupon.title.isNotEmpty ? coupon.title : coupon.restaurantName,
                    maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(color: scheme.onPrimary)),
              const SizedBox(height: 4),
              Text(tr('offer.useCode', {'code': coupon.code}), style: TextStyle(color: scheme.onPrimary, fontWeight: FontWeight.w600, fontSize: 12)),
              if (coupon.minOrderValue > 0)
                Text(tr('offer.minOrder', {'amount': Fmt.money(coupon.minOrderValue)}), style: TextStyle(color: scheme.onPrimary, fontSize: 11)),
            ]),
          ),
          IconButton(
            icon: Icon(onApply != null ? Icons.check_circle_outline : Icons.copy, color: scheme.onPrimary),
            onPressed: onApply ??
                () {
                  Clipboard.setData(ClipboardData(text: coupon.code));
                  showMessage(context, 'offer.copied', {'code': coupon.code});
                },
          ),
        ]),
      ),
    );
  }
}

final couponsProvider = FutureProvider.autoDispose.family<List<Coupon>, String?>((ref, restaurantId) async {
  final list = await ApiService.instance.availableCoupons(restaurantId: restaurantId);
  return list.map((e) => Coupon.fromJson(toMap(e))).toList();
});

class OffersSection extends ConsumerWidget {
  final WidgetSection section;
  const OffersSection({super.key, required this.section});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(couponsProvider(null));
    return async.when(
      loading: () => const SizedBox(height: 100, child: LoadingView()),
      error: (_, __) => const SizedBox.shrink(),
      data: (list) {
        final items = list.take(section.limit > 0 ? section.limit : 100).toList();
        if (items.isEmpty) return const SizedBox.shrink();
        if (section.layout == 'list') {
          return Column(children: items.map((c) => Padding(padding: const EdgeInsets.fromLTRB(16, 0, 16, 10), child: OfferCard(coupon: c))).toList());
        }
        return SizedBox(
          height: 110,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            scrollDirection: Axis.horizontal,
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (_, i) => OfferCard(coupon: items[i], width: 280),
          ),
        );
      },
    );
  }
}
