import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/translation_manager.dart';
import '../../models/widget_section.dart';
import '../../providers/config_provider.dart';
import '../../providers/restaurant_provider.dart';
import '../../widgets/common/inputs.dart';
import '../../widgets/common/states.dart';
import '../../widgets/dynamic/category_grid.dart';
import '../../widgets/dynamic/restaurant_card.dart';

/// Search + category/cuisine listing. Filters are shown only if `searchFilters` is on,
/// the veg toggle only if `vegOnlyFilter` is on.
class SearchScreen extends ConsumerStatefulWidget {
  final Map<String, dynamic> args;
  final bool embedded;
  const SearchScreen({super.key, required this.args, this.embedded = false});
  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _ctrl = TextEditingController();
  Timer? _debounce;
  late RestaurantQuery _query;

  @override
  void initState() {
    super.initState();
    final section = widget.args['section'];
    _query = section is WidgetSection
        ? RestaurantQuery.fromSection(section.filter, limit: 50, featured: section.type == 'featured', sort: section.type == 'topRated' ? 'rating' : '')
        : RestaurantQuery(category: widget.args['category'] ?? '', cuisine: widget.args['cuisine'] ?? '', limit: 50);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  void _onChanged(String v) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () => setState(() => _query = _query.copyWith(q: v.trim())));
  }

  bool get _hasCriteria =>
      _query.q.isNotEmpty ||
      _query.category.isNotEmpty ||
      _query.cuisine.isNotEmpty ||
      _query.featured ||
      _query.sort.isNotEmpty ||
      _query.vegOnly ||
      _query.minRating != null;

  @override
  Widget build(BuildContext context) {
    final cfg = ref.watch(appConfigProvider);
    final showFilters = cfg.feature('searchFilters');
    final showVeg = cfg.feature('vegOnlyFilter');
    final title = widget.args['title'] as String?;
    final body = Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
        child: SearchField(
            controller: _ctrl, hintKey: 'home.searchHint', autofocus: title == null && !widget.embedded, onChanged: _onChanged, onSubmitted: _onChanged),
      ),
      if (showFilters || showVeg)
        SizedBox(
          height: 44,
          child: ListView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 12), children: [
            if (showVeg)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: FilterChip(
                    label: Text(tr('filter.vegOnly')), selected: _query.vegOnly, onSelected: (v) => setState(() => _query = _query.copyWith(vegOnly: v))),
              ),
            if (showFilters) ...[
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: FilterChip(
                  label: Text(tr('filter.rating4')),
                  selected: _query.minRating != null,
                  onSelected: (v) => setState(() => _query = v ? _query.copyWith(minRating: 4) : _query.copyWith(clearRating: true)),
                ),
              ),
              for (final s in const ['rating', 'deliveryTime', 'priceLow', 'priceHigh', 'popular'])
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: ChoiceChip(
                      label: Text(tr('sort.$s')), selected: _query.sort == s, onSelected: (v) => setState(() => _query = _query.copyWith(sort: v ? s : ''))),
                ),
            ],
          ]),
        ),
      Expanded(
        child: !_hasCriteria
            ? ListView(children: [
                if (cfg.cuisines.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: cfg.cuisines
                          .map((c) => ActionChip(label: Text(categoryLabel(c)), onPressed: () => setState(() => _query = _query.copyWith(cuisine: c.name))))
                          .toList(),
                    ),
                  ),
                if (cfg.categories.isNotEmpty)
                  CategoryGrid(section: WidgetSection.fromJson(const {'type': 'categories', 'layout': 'grid', 'columns': 4, 'limit': 100})),
              ])
            : Consumer(builder: (context, ref, _) {
                final async = ref.watch(restaurantListProvider(_query));
                return async.when(
                  loading: () => const LoadingView(),
                  error: (e, _) => ErrorView(error: e, onRetry: () => ref.invalidate(restaurantListProvider(_query))),
                  data: (list) => list.isEmpty
                      ? const EmptyState(icon: Icons.search_off, titleKey: 'search.noResults')
                      : ListView.builder(
                          padding: const EdgeInsets.only(bottom: 90), itemCount: list.length, itemBuilder: (_, i) => RestaurantCard(restaurant: list[i])),
                );
              }),
      ),
    ]);
    if (widget.embedded) return SafeArea(child: body);
    return Scaffold(appBar: AppBar(title: Text(title ?? tr('nav.search'))), body: body);
  }
}
