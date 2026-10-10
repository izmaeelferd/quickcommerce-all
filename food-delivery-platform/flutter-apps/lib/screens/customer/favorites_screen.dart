import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/translation_manager.dart';
import '../../providers/restaurant_provider.dart';
import '../../widgets/common/states.dart';
import '../../widgets/dynamic/restaurant_card.dart';

class FavoritesScreen extends ConsumerWidget {
  const FavoritesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(favoritesProvider);
    return Scaffold(
      appBar: AppBar(title: Text(tr('profile.favorites'))),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(error: e, onRetry: () => ref.invalidate(favoritesProvider)),
        data: (list) => list.isEmpty
            ? const EmptyState(icon: Icons.favorite_border, titleKey: 'favorites.empty')
            : ListView.builder(itemCount: list.length, itemBuilder: (_, i) => RestaurantCard(restaurant: list[i])),
      ),
    );
  }
}
