import 'json_utils.dart';

class AddOnOption {
  final String id;
  final String name;
  final double price;
  final bool isVeg;
  final bool isAvailable;
  const AddOnOption(this.id, this.name, this.price, this.isVeg, this.isAvailable);
  factory AddOnOption.fromJson(Map<String, dynamic> j) =>
      AddOnOption(toStr(j['_id']), toStr(j['name']), toDouble(j['price']), toBool(j['isVeg'], true), toBool(j['isAvailable'], true));
  Map<String, dynamic> toJson() => {if (id.isNotEmpty) '_id': id, 'name': name, 'price': price, 'isVeg': isVeg, 'isAvailable': isAvailable};
}

class AddOnGroup {
  final String id;
  final String name;
  final bool required;
  final int minSelect;
  final int maxSelect;
  final List<AddOnOption> options;
  const AddOnGroup(this.id, this.name, this.required, this.minSelect, this.maxSelect, this.options);
  factory AddOnGroup.fromJson(Map<String, dynamic> j) => AddOnGroup(
        toStr(j['_id']),
        toStr(j['name']),
        toBool(j['required']),
        toInt(j['minSelect']),
        toInt(j['maxSelect'], 1),
        toList(j['options']).map((e) => AddOnOption.fromJson(toMap(e))).toList(),
      );
  Map<String, dynamic> toJson() => {
        if (id.isNotEmpty) '_id': id,
        'name': name,
        'required': required,
        'minSelect': minSelect,
        'maxSelect': maxSelect,
        'options': options.map((o) => o.toJson()).toList(),
      };
}

class MenuItem {
  final String id;
  final String restaurantId;
  final String categoryId;
  final String categoryName;
  final String name;
  final String description;
  final double price;
  final double? discountPrice;
  final String image;
  final bool isVeg;
  final bool isAvailable;
  final bool isBestseller;
  final int spiceLevel;
  final List<AddOnGroup> addOns;

  const MenuItem({
    required this.id,
    required this.restaurantId,
    required this.categoryId,
    required this.categoryName,
    required this.name,
    required this.description,
    required this.price,
    required this.discountPrice,
    required this.image,
    required this.isVeg,
    required this.isAvailable,
    required this.isBestseller,
    required this.spiceLevel,
    required this.addOns,
  });

  double get effectivePrice => discountPrice != null && discountPrice! < price ? discountPrice! : price;
  bool get hasDiscount => discountPrice != null && discountPrice! < price;

  factory MenuItem.fromJson(Map<String, dynamic> j) => MenuItem(
        id: toStr(j['_id']),
        restaurantId: idOf(j['restaurant']),
        categoryId: idOf(j['category']),
        categoryName: j['category'] is Map ? toStr(j['category']['name']) : '',
        name: toStr(j['name']),
        description: toStr(j['description']),
        price: toDouble(j['price']),
        discountPrice: j['discountPrice'] == null ? null : toDouble(j['discountPrice']),
        image: toStr(j['image']),
        isVeg: toBool(j['isVeg'], true),
        isAvailable: toBool(j['isAvailable'], true),
        isBestseller: toBool(j['isBestseller']),
        spiceLevel: toInt(j['spiceLevel']),
        addOns: toList(j['addOns']).map((e) => AddOnGroup.fromJson(toMap(e))).toList(),
      );
}

class MenuCategory {
  final String id;
  final String name;
  final String description;
  final bool isActive;
  final int order;
  final int itemCount;
  final List<MenuItem> items;
  const MenuCategory(this.id, this.name, this.description, this.isActive, this.order, this.itemCount, this.items);
  factory MenuCategory.fromJson(Map<String, dynamic> j) {
    final items = toList(j['items']).map((e) => MenuItem.fromJson(toMap(e))).toList();
    return MenuCategory(
        toStr(j['_id']), toStr(j['name']), toStr(j['description']), toBool(j['isActive'], true), toInt(j['order']), toInt(j['itemCount'], items.length), items);
  }
}

/// A dish shown in a custom home section, with the restaurant data needed for the card.
class PickedDish {
  final MenuItem item;
  final String restaurantId;
  final String restaurantName;
  final bool restaurantOpen;
  const PickedDish({required this.item, required this.restaurantId, required this.restaurantName, required this.restaurantOpen});

  factory PickedDish.fromJson(Map<String, dynamic> j) {
    final r = toMap(j['restaurant']);
    return PickedDish(
      item: MenuItem.fromJson(j),
      restaurantId: toStr(r['_id']),
      restaurantName: toStr(r['name']),
      restaurantOpen: toBool(r['isOpen'], true) && toBool(r['acceptingOrders'], true),
    );
  }
}
