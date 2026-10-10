import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/dynamic_theme.dart';
import '../../core/formatters.dart';
import '../../core/routes.dart';
import '../../core/translation_manager.dart';
import '../../models/restaurant.dart';
import '../common/cards.dart';

/// Restaurant tile. `compact` is used by carousels and grids, full width by lists.
class RestaurantCard extends ConsumerWidget {
  final Restaurant restaurant;
  final bool compact;
  const RestaurantCard({super.key, required this.restaurant, this.compact = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final r = restaurant;
    final radius = AppColors.of(context).cardRadius;
    final scheme = Theme.of(context).colorScheme;
    final text = Theme.of(context).textTheme;
    final meta = [
      if (r.avgPrepTimeMinutes > 0) Fmt.minutes(r.avgPrepTimeMinutes),
      if (r.distanceKm != null) Fmt.km(r.distanceKm),
      if (r.priceForTwo > 0) tr('restaurant.priceForTwo', {'price': Fmt.money(r.priceForTwo)}),
    ].join(' • ');

    final image = Stack(children: [
      NetImage(r.coverImage.isNotEmpty ? r.coverImage : r.logo, height: compact ? 120 : 170, width: double.infinity, radius: radius),
      if (r.offerText.isNotEmpty)
        Positioned(
          left: 0,
          bottom: 10,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(color: scheme.primary, borderRadius: const BorderRadius.horizontal(right: Radius.circular(6))),
            child: Text(r.offerText, style: TextStyle(color: scheme.onPrimary, fontWeight: FontWeight.bold, fontSize: 12)),
          ),
        ),
      if (!r.isOpenNow)
        Positioned.fill(
          child: Container(
            decoration: BoxDecoration(color: scheme.scrim.withValues(alpha: 0.55), borderRadius: BorderRadius.circular(radius)),
            alignment: Alignment.center,
            child: Text(tr('restaurant.closedNow'), style: TextStyle(color: scheme.onPrimary, fontWeight: FontWeight.bold)),
          ),
        ),
      if (r.isPureVeg)
        Positioned(top: 10, right: 10, child: Container(padding: const EdgeInsets.all(3), color: scheme.surface, child: const VegBadge(isVeg: true))),
    ]);

    return InkWell(
      onTap: () => Navigator.pushNamed(context, Routes.restaurant, arguments: r.id),
      borderRadius: BorderRadius.circular(radius),
      child: Padding(
        padding: EdgeInsets.symmetric(horizontal: compact ? 0 : 16, vertical: 8),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          image,
          const SizedBox(height: 8),
          Row(children: [
            Expanded(child: Text(r.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: text.titleMedium?.copyWith(fontWeight: FontWeight.w700))),
            RatingBadge(rating: r.rating),
          ]),
          const SizedBox(height: 2),
          Text(r.cuisines.join(', '), maxLines: 1, overflow: TextOverflow.ellipsis, style: text.bodySmall),
          if (meta.isNotEmpty) Text(meta, maxLines: 1, overflow: TextOverflow.ellipsis, style: text.bodySmall?.copyWith(color: scheme.outline)),
        ]),
      ),
    );
  }
}
