import 'package:flutter_test/flutter_test.dart';
import 'package:food_delivery_apps/models/app_config.dart';
import 'package:food_delivery_apps/models/cart.dart';
import 'package:food_delivery_apps/models/menu_item.dart';

void main() {
  test('AppConfig parses remote config and orders enabled sections', () {
    final cfg = AppConfig.fromJson({
      'theme': {'primaryColor': '#112233', 'cardRadius': 20},
      'features': {'wallet': true, 'coupons': false},
      'businessRules': {'currencySymbol': 'X', 'tipPresets': [5, 10], 'paymentMethods': {'cod': true, 'card': false}},
      'homeLayout': [
        {'id': 'b', 'type': 'restaurants', 'enabled': true, 'order': 2},
        {'id': 'a', 'type': 'banner', 'enabled': true, 'order': 1},
        {'id': 'c', 'type': 'offers', 'enabled': false, 'order': 0},
      ],
    });
    expect(cfg.theme.primaryColor, '#112233');
    expect(cfg.theme.cardRadius, 20);
    expect(cfg.feature('wallet'), isTrue);
    expect(cfg.feature('coupons'), isFalse);
    expect(cfg.feature('unknown'), isFalse);
    expect(cfg.businessRules.tipPresets, [5, 10]);
    expect(cfg.businessRules.enabledPaymentMethods, ['cod']);
    expect(cfg.enabledSections.map((s) => s.id).toList(), ['a', 'b']);
  });

  test('Cart merges identical lines and computes totals with add-ons', () {
    final item = MenuItem.fromJson({
      '_id': 'i1',
      'restaurant': 'r1',
      'category': 'c1',
      'name': 'Pizza',
      'price': 200,
      'discountPrice': 180,
      'addOns': [
        {
          '_id': 'g1',
          'name': 'Crust',
          'options': [
            {'_id': 'o1', 'name': 'Cheese', 'price': 40}
          ]
        }
      ],
    });
    final sel = [CartAddOnSelection('g1', 'Crust', [item.addOns.first.options.first])];
    final a = CartItem(item: item, quantity: 1, addOns: sel);
    final b = CartItem(item: item, quantity: 2, addOns: sel);
    expect(a.key, b.key);
    expect(a.unitPrice, 220);
    final cart = Cart(restaurantId: 'r1', items: [a.copyWith(quantity: 3)]);
    expect(cart.subtotal, 660);
    expect(cart.count, 3);
  });
}
