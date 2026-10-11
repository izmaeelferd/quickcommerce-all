import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../../core/dynamic_theme.dart';
import '../../core/translation_manager.dart';

class AppCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  const AppCard({super.key, required this.child, this.padding = const EdgeInsets.all(14), this.onTap});

  @override
  Widget build(BuildContext context) {
    final r = AppColors.of(context).cardRadius;
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(onTap: onTap, borderRadius: BorderRadius.circular(r), child: Padding(padding: padding, child: child)),
    );
  }
}

/// Network image with themed placeholder; empty URL renders an icon tile.
class NetImage extends StatelessWidget {
  final String url;
  final double? width;
  final double? height;
  final BoxFit fit;
  final double radius;
  final IconData placeholderIcon;
  const NetImage(this.url, {super.key, this.width, this.height, this.fit = BoxFit.cover, this.radius = 0, this.placeholderIcon = Icons.restaurant});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final placeholder = Container(width: width, height: height, color: scheme.surfaceContainerHighest, child: Icon(placeholderIcon, color: scheme.outline));
    final img = url.isEmpty
        ? placeholder
        : CachedNetworkImage(
            imageUrl: url, width: width, height: height, fit: fit, placeholder: (_, __) => placeholder, errorWidget: (_, __, ___) => placeholder);
    return radius > 0 ? ClipRRect(borderRadius: BorderRadius.circular(radius), child: img) : img;
  }
}

class VegBadge extends StatelessWidget {
  final bool isVeg;
  final double size;
  const VegBadge({super.key, required this.isVeg, this.size = 16});

  @override
  Widget build(BuildContext context) {
    final c = isVeg ? AppColors.of(context).veg : AppColors.of(context).nonVeg;
    return Tooltip(
      message: tr(isVeg ? 'menu.veg' : 'menu.nonVeg'),
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(border: Border.all(color: c, width: 1.5), borderRadius: BorderRadius.circular(3)),
        child: Center(child: Container(width: size / 2, height: size / 2, decoration: BoxDecoration(color: c, shape: BoxShape.circle))),
      ),
    );
  }
}

class RatingBadge extends StatelessWidget {
  final double rating;
  final int? count;
  const RatingBadge({super.key, required this.rating, this.count});

  @override
  Widget build(BuildContext context) {
    final c = rating >= 4 ? AppColors.of(context).success : (rating >= 3 ? AppColors.of(context).warning : Theme.of(context).colorScheme.error);
    if (rating == 0) {
      return Text(tr('restaurant.new'), style: TextStyle(color: AppColors.of(context).accent, fontWeight: FontWeight.w600));
    }
    return Row(mainAxisSize: MainAxisSize.min, children: [
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
        decoration: BoxDecoration(color: c, borderRadius: BorderRadius.circular(6)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Text(rating.toStringAsFixed(1), style: TextStyle(color: Theme.of(context).colorScheme.onPrimary, fontWeight: FontWeight.bold, fontSize: 12)),
          const SizedBox(width: 2),
          Icon(Icons.star, size: 12, color: Theme.of(context).colorScheme.onPrimary),
        ]),
      ),
      if (count != null) ...[
        const SizedBox(width: 4),
        Text(tr('restaurant.ratingsCount', {'count': count}), style: Theme.of(context).textTheme.bodySmall)
      ],
    ]);
  }
}

class SectionHeader extends StatelessWidget {
  final String title;
  final String subtitle;
  final VoidCallback? onSeeAll;
  const SectionHeader({super.key, required this.title, this.subtitle = '', this.onSeeAll});

  @override
  Widget build(BuildContext context) {
    if (title.isEmpty) return const SizedBox(height: 8);
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 8, 10),
      child: Row(children: [
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
            if (subtitle.isNotEmpty) Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
          ]),
        ),
        if (onSeeAll != null) TextButton(onPressed: onSeeAll, child: Text(tr('common.seeAll'))),
      ]),
    );
  }
}
