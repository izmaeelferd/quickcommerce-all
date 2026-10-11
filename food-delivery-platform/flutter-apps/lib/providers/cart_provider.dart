import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/cart.dart';
import '../models/menu_item.dart';

enum AddResult { added, differentRestaurant }

class CartNotifier extends StateNotifier<Cart> {
  CartNotifier() : super(const Cart());

  AddResult add(MenuItem item,
      {required String restaurantName, int quantity = 1, List<CartAddOnSelection> addOns = const [], String instructions = '', bool replace = false}) {
    if (state.restaurantId != null && state.restaurantId != item.restaurantId && state.items.isNotEmpty) {
      if (!replace) return AddResult.differentRestaurant;
      state = const Cart();
    }
    final line = CartItem(item: item, quantity: quantity, addOns: addOns, instructions: instructions);
    final items = [...state.items];
    final idx = items.indexWhere((i) => i.key == line.key);
    if (idx >= 0) {
      items[idx] = items[idx].copyWith(quantity: items[idx].quantity + quantity);
    } else {
      items.add(line);
    }
    state = state.copyWith(restaurantId: item.restaurantId, restaurantName: restaurantName, items: items);
    return AddResult.added;
  }

  void setQuantity(String key, int quantity) {
    final items = [...state.items];
    final idx = items.indexWhere((i) => i.key == key);
    if (idx < 0) return;
    if (quantity <= 0) {
      items.removeAt(idx);
    } else {
      items[idx] = items[idx].copyWith(quantity: quantity);
    }
    state = items.isEmpty ? const Cart() : state.copyWith(items: items);
  }

  /// Decrements the most recently added line of a menu item (used by +/- on menu list).
  void decrementItem(String menuItemId) {
    final lines = state.items.where((i) => i.item.id == menuItemId).toList();
    if (lines.isEmpty) return;
    final last = lines.last;
    setQuantity(last.key, last.quantity - 1);
  }

  void applyCoupon(String? code) => state = code == null ? state.copyWith(clearCoupon: true) : state.copyWith(couponCode: code);
  void setTip(double tip) => state = state.copyWith(tip: tip);
  void setUseWallet(bool v) => state = state.copyWith(useWallet: v);
  void clear() => state = const Cart();
}

final cartProvider = StateNotifierProvider<CartNotifier, Cart>((ref) => CartNotifier());

/// Checkout choices made on the cart screen and consumed by the payment screen.
class CheckoutOptions {
  final String? addressId;
  final String? slotId;
  final DateTime? scheduledFor;
  final String instructions;
  const CheckoutOptions({this.addressId, this.slotId, this.scheduledFor, this.instructions = ''});
  CheckoutOptions copyWith({String? addressId, String? slotId, DateTime? scheduledFor, bool clearSchedule = false, String? instructions}) => CheckoutOptions(
        addressId: addressId ?? this.addressId,
        slotId: clearSchedule ? null : (slotId ?? this.slotId),
        scheduledFor: clearSchedule ? null : (scheduledFor ?? this.scheduledFor),
        instructions: instructions ?? this.instructions,
      );
}

final checkoutProvider = StateProvider<CheckoutOptions>((ref) => const CheckoutOptions());

/// Body shared by POST /orders/quote and POST /orders.
Map<String, dynamic> orderBody(Cart cart, CheckoutOptions co) => {
      'restaurantId': cart.restaurantId,
      'items': cart.items.map((i) => i.toOrderJson()).toList(),
      if (cart.couponCode != null) 'couponCode': cart.couponCode,
      'tip': cart.tip,
      'useWallet': cart.useWallet,
      if (co.addressId != null) 'addressId': co.addressId,
      if (co.scheduledFor != null) 'scheduledFor': co.scheduledFor!.toUtc().toIso8601String(),
      if (co.slotId != null) 'deliverySlot': co.slotId,
      'instructions': co.instructions,
    };
