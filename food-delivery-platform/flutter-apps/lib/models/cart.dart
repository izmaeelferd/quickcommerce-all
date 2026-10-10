import 'menu_item.dart';

class CartAddOnSelection {
  final String groupId;
  final String groupName;
  final List<AddOnOption> options;
  const CartAddOnSelection(this.groupId, this.groupName, this.options);
  Map<String, dynamic> toJson() => {'groupId': groupId, 'optionIds': options.map((o) => o.id).toList()};
}

class CartItem {
  final MenuItem item;
  final int quantity;
  final List<CartAddOnSelection> addOns;
  final String instructions;

  const CartItem({required this.item, required this.quantity, this.addOns = const [], this.instructions = ''});

  /// Same item with the same add-on selection merges into one line.
  String get key => '${item.id}|${addOns.map((a) => '${a.groupId}:${a.options.map((o) => o.id).join(',')}').join(';')}';

  double get unitPrice => item.effectivePrice + addOns.fold<double>(0, (s, a) => s + a.options.fold<double>(0, (x, o) => x + o.price));
  double get lineTotal => unitPrice * quantity;

  CartItem copyWith({int? quantity}) => CartItem(item: item, quantity: quantity ?? this.quantity, addOns: addOns, instructions: instructions);

  Map<String, dynamic> toOrderJson() => {
        'menuItemId': item.id,
        'quantity': quantity,
        'addOns': addOns.map((a) => a.toJson()).toList(),
        'instructions': instructions,
      };
}

class Cart {
  final String? restaurantId;
  final String restaurantName;
  final List<CartItem> items;
  final String? couponCode;
  final double tip;
  final bool useWallet;

  const Cart({this.restaurantId, this.restaurantName = '', this.items = const [], this.couponCode, this.tip = 0, this.useWallet = false});

  bool get isEmpty => items.isEmpty;
  int get count => items.fold(0, (s, i) => s + i.quantity);
  double get subtotal => items.fold(0, (s, i) => s + i.lineTotal);
  int quantityOf(String menuItemId) => items.where((i) => i.item.id == menuItemId).fold(0, (s, i) => s + i.quantity);

  Cart copyWith({
    String? restaurantId,
    String? restaurantName,
    List<CartItem>? items,
    String? couponCode,
    bool clearCoupon = false,
    double? tip,
    bool? useWallet,
  }) =>
      Cart(
        restaurantId: restaurantId ?? this.restaurantId,
        restaurantName: restaurantName ?? this.restaurantName,
        items: items ?? this.items,
        couponCode: clearCoupon ? null : (couponCode ?? this.couponCode),
        tip: tip ?? this.tip,
        useWallet: useWallet ?? this.useWallet,
      );
}
