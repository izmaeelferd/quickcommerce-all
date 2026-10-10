import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/dynamic_theme.dart';
import '../../core/routes.dart';
import '../../models/widget_section.dart';
import '../../providers/config_provider.dart';
import '../common/cards.dart';
import 'category_grid.dart';

class CuisineRow extends ConsumerWidget {
  final WidgetSection section;
  const CuisineRow({super.key, required this.section});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cuisines = ref.watch(appConfigProvider).cuisines.take(section.limit > 0 ? section.limit : 100).toList();
    if (cuisines.isEmpty) return const SizedBox.shrink();
    final radius = AppColors.of(context).cardRadius;
    final scheme = Theme.of(context).colorScheme;

    Widget card(c) => GestureDetector(
          onTap: () => Navigator.pushNamed(context, Routes.search, arguments: {'cuisine': c.name, 'title': categoryLabel(c)}),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(radius),
            child: Stack(fit: StackFit.expand, children: [
              NetImage(c.image, placeholderIcon: Icons.ramen_dining),
              DecoratedBox(
                  decoration: BoxDecoration(
                      gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [scheme.scrim.withValues(alpha: 0), scheme.scrim.withValues(alpha: 0.6)]))),
              Positioned(left: 10, bottom: 8, right: 10, child: Text(categoryLabel(c), style: TextStyle(color: scheme.onPrimary, fontWeight: FontWeight.bold))),
            ]),
          ),
        );

    if (section.layout == 'grid') {
      return GridView.count(
        crossAxisCount: section.columns.clamp(2, 4),
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
        children: cuisines.map(card).toList(),
      );
    }
    return SizedBox(
      height: 110,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: cuisines.length,
        separatorBuilder: (_, __) => const SizedBox(width: 10),
        itemBuilder: (_, i) => SizedBox(width: 110, child: card(cuisines[i])),
      ),
    );
  }
}
