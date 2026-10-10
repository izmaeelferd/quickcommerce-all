import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/routes.dart';
import '../../core/translation_manager.dart';
import '../../models/widget_section.dart';
import '../../providers/config_provider.dart';
import '../../providers/restaurant_provider.dart';
import '../common/cards.dart';
import '../common/inputs.dart';
import 'banner_widget.dart';
import 'category_grid.dart';
import 'cuisine_row.dart';
import 'offer_card.dart';
import 'restaurant_section.dart';

/// Renders a single homeLayout entry by `type`. Unknown types render nothing,
/// so new section types can be added server-side without breaking old app builds.
class SectionRenderer extends ConsumerWidget {
  final WidgetSection section;
  const SectionRenderer({super.key, required this.section});

  String _title() {
    if (section.titleKey.isNotEmpty && TranslationManager.instance.has(section.titleKey)) return tr(section.titleKey);
    return section.title;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final title = _title();
    switch (section.type) {
      case 'search':
        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
          child: SearchField(
              hintKey: section.titleKey.isNotEmpty ? section.titleKey : 'home.searchHint',
              readOnly: true,
              onTap: () => Navigator.pushNamed(context, Routes.search)),
        );
      case 'banner':
        return BannerWidget(section: section);
      case 'categories':
        return Column(
            crossAxisAlignment: CrossAxisAlignment.start, children: [SectionHeader(title: title, subtitle: section.subtitle), CategoryGrid(section: section)]);
      case 'cuisines':
        return Column(
            crossAxisAlignment: CrossAxisAlignment.start, children: [SectionHeader(title: title, subtitle: section.subtitle), CuisineRow(section: section)]);
      case 'offers':
        if (!ref.watch(featureProvider('coupons'))) return const SizedBox.shrink();
        return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          SectionHeader(title: title, subtitle: section.subtitle, onSeeAll: () => Navigator.pushNamed(context, Routes.offers)),
          OffersSection(section: section),
        ]);
      case 'restaurants':
      case 'featured':
      case 'topRated':
      case 'nearby':
      case 'custom':
        final query = RestaurantQuery.fromSection(
          section.filter,
          limit: section.limit,
          featured: section.type == 'featured',
          sort: switch (section.type) { 'topRated' => 'rating', 'nearby' => '', _ => '' },
        );
        return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          SectionHeader(
            title: title,
            subtitle: section.subtitle,
            onSeeAll: section.layout == 'list' ? null : () => Navigator.pushNamed(context, Routes.search, arguments: {'section': section, 'title': title}),
          ),
          RestaurantSection(section: section, query: query),
        ]);
      default:
        return const SizedBox.shrink();
    }
  }
}
