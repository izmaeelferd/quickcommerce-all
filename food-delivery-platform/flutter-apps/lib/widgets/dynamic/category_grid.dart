import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/routes.dart';
import '../../core/translation_manager.dart';
import '../../models/category.dart';
import '../../models/widget_section.dart';
import '../../providers/config_provider.dart';
import '../common/cards.dart';

String categoryLabel(CategoryModel c) => c.nameKey.isNotEmpty && TranslationManager.instance.has(c.nameKey) ? tr(c.nameKey) : c.name;

/// Food categories managed from Admin → Categories. Layout grid/carousel from homeLayout.
class CategoryGrid extends ConsumerWidget {
  final WidgetSection section;
  const CategoryGrid({super.key, required this.section});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cats = ref.watch(appConfigProvider).categories.take(section.limit > 0 ? section.limit : 100).toList();
    if (cats.isEmpty) return const SizedBox.shrink();
    void open(CategoryModel c) => Navigator.pushNamed(context, Routes.search, arguments: {'category': c.id, 'title': categoryLabel(c)});

    Widget tile(CategoryModel c) => InkWell(
          onTap: () => open(c),
          borderRadius: BorderRadius.circular(12),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            ClipOval(child: NetImage(c.image, width: 64, height: 64, placeholderIcon: Icons.fastfood)),
            const SizedBox(height: 6),
            Text(categoryLabel(c),
                maxLines: 1, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600)),
          ]),
        );

    if (section.layout == 'carousel' || section.layout == 'list') {
      return SizedBox(
        height: 100,
        child: ListView.separated(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          scrollDirection: Axis.horizontal,
          itemCount: cats.length,
          separatorBuilder: (_, __) => const SizedBox(width: 14),
          itemBuilder: (_, i) => SizedBox(width: 72, child: tile(cats[i])),
        ),
      );
    }
    return GridView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: section.columns.clamp(2, 6), mainAxisSpacing: 12, crossAxisSpacing: 8, childAspectRatio: 0.82),
      itemCount: cats.length,
      itemBuilder: (_, i) => tile(cats[i]),
    );
  }
}
