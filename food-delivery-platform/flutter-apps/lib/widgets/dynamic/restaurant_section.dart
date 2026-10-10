import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/widget_section.dart';
import '../../providers/restaurant_provider.dart';
import '../common/states.dart';
import 'restaurant_card.dart';

/// Any restaurant-list section (restaurants / featured / topRated / nearby / custom).
class RestaurantSection extends ConsumerWidget {
  final WidgetSection section;
  final RestaurantQuery query;
  const RestaurantSection({super.key, required this.section, required this.query});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(restaurantListProvider(query));
    return async.when(
      loading: () => const SizedBox(height: 180, child: LoadingView()),
      error: (e, _) => ErrorView(error: e, onRetry: () => ref.invalidate(restaurantListProvider(query))),
      data: (list) {
        if (list.isEmpty) return const SizedBox.shrink();
        switch (section.layout) {
          case 'carousel':
            return SizedBox(
              height: 220,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                itemCount: list.length,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (_, i) => SizedBox(width: 240, child: RestaurantCard(restaurant: list[i], compact: true)),
              ),
            );
          case 'grid':
            return GridView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate:
                  SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: section.columns.clamp(1, 3), crossAxisSpacing: 12, childAspectRatio: 0.78),
              itemCount: list.length,
              itemBuilder: (_, i) => RestaurantCard(restaurant: list[i], compact: true),
            );
          default:
            return Column(children: list.map((r) => RestaurantCard(restaurant: r)).toList());
        }
      },
    );
  }
}
