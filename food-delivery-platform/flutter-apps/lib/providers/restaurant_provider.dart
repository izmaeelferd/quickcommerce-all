import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/json_utils.dart';
import '../models/menu_item.dart';
import '../models/restaurant.dart';
import '../models/review.dart';
import '../services/api_service.dart';
import '../services/location_service.dart';

/// Query used by any restaurant list (home sections, search, category pages).
class RestaurantQuery {
  final String q;
  final String cuisine;
  final String category;
  final bool vegOnly;
  final String sort;
  final double? minRating;
  final bool featured;
  final int limit;

  const RestaurantQuery(
      {this.q = '', this.cuisine = '', this.category = '', this.vegOnly = false, this.sort = '', this.minRating, this.featured = false, this.limit = 20});

  RestaurantQuery copyWith(
          {String? q, String? cuisine, String? category, bool? vegOnly, String? sort, double? minRating, bool clearRating = false, bool? featured}) =>
      RestaurantQuery(
        q: q ?? this.q,
        cuisine: cuisine ?? this.cuisine,
        category: category ?? this.category,
        vegOnly: vegOnly ?? this.vegOnly,
        sort: sort ?? this.sort,
        minRating: clearRating ? null : (minRating ?? this.minRating),
        featured: featured ?? this.featured,
        limit: limit,
      );

  /// Builds a query from a homeLayout section's `filter` map.
  factory RestaurantQuery.fromSection(Map<String, dynamic> filter, {int limit = 20, String sort = '', bool featured = false}) => RestaurantQuery(
        cuisine: toStr(filter['cuisine']),
        category: toStr(filter['category']),
        vegOnly: toBool(filter['veg']),
        sort: toStr(filter['sort'], sort),
        minRating: filter['minRating'] == null ? null : toDouble(filter['minRating']),
        featured: toBool(filter['featured'], featured),
        limit: limit,
      );

  @override
  bool operator ==(Object other) =>
      other is RestaurantQuery &&
      other.q == q &&
      other.cuisine == cuisine &&
      other.category == category &&
      other.vegOnly == vegOnly &&
      other.sort == sort &&
      other.minRating == minRating &&
      other.featured == featured &&
      other.limit == limit;

  @override
  int get hashCode => Object.hash(q, cuisine, category, vegOnly, sort, minRating, featured, limit);
}

final restaurantListProvider = FutureProvider.autoDispose.family<List<Restaurant>, RestaurantQuery>((ref, query) async {
  final pos = LocationService.instance.last ?? await LocationService.instance.current();
  final data = await ApiService.instance.restaurants({
    'q': query.q,
    'cuisine': query.cuisine,
    'category': query.category,
    'veg': query.vegOnly ? 'true' : null,
    'sort': query.sort,
    'minRating': query.minRating,
    'featured': query.featured ? 'true' : null,
    'limit': query.limit,
    'lat': pos?.latitude,
    'lng': pos?.longitude,
  });
  return toList(data['items']).map((e) => Restaurant.fromJson(toMap(e))).toList();
});

final restaurantDetailProvider = FutureProvider.autoDispose.family<Restaurant, String>((ref, id) async {
  return Restaurant.fromJson(await ApiService.instance.restaurant(id));
});

class MenuData {
  final List<MenuCategory> categories;
  final List<MenuItem> recommended;
  const MenuData(this.categories, this.recommended);
}

final menuProvider = FutureProvider.autoDispose.family<MenuData, ({String id, bool vegOnly})>((ref, args) async {
  final data = await ApiService.instance.menu(args.id, vegOnly: args.vegOnly);
  return MenuData(
    toList(data['categories']).map((e) => MenuCategory.fromJson(toMap(e))).toList(),
    toList(data['recommended']).map((e) => MenuItem.fromJson(toMap(e))).toList(),
  );
});

final reviewsProvider = FutureProvider.autoDispose.family<List<Review>, String>((ref, id) async {
  final data = await ApiService.instance.reviews(id);
  return toList(data['items']).map((e) => Review.fromJson(toMap(e))).toList();
});

final favoritesProvider = FutureProvider.autoDispose<List<Restaurant>>((ref) async {
  final list = await ApiService.instance.favorites();
  return list.map((e) => Restaurant.fromJson(toMap(e))).toList();
});
