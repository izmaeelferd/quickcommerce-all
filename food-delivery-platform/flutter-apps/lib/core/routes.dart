import 'package:flutter/material.dart';

import '../screens/customer/address_screens.dart';
import '../screens/customer/cart_screen.dart';
import '../screens/customer/customer_shell.dart';
import '../screens/customer/favorites_screen.dart';
import '../screens/customer/offers_screen.dart';
import '../screens/customer/onboarding_screen.dart';
import '../screens/customer/order_confirmation_screen.dart';
import '../screens/customer/order_history_screen.dart';
import '../screens/customer/order_tracking_screen.dart';
import '../screens/customer/payment_screen.dart';
import '../screens/customer/rate_review_screen.dart';
import '../screens/customer/referral_screen.dart';
import '../screens/customer/restaurant_detail_screen.dart';
import '../screens/customer/search_screen.dart';
import '../screens/customer/wallet_screen.dart';
import '../screens/delivery/delivery_screens.dart';
import '../screens/delivery/delivery_shell.dart';
import '../screens/shared/auth_screens.dart';
import '../screens/shared/legal_screen.dart';
import '../screens/shared/maintenance_screen.dart';
import '../screens/shared/notifications_screen.dart';
import '../screens/shared/settings_screens.dart';
import '../screens/vendor/vendor_menu_screens.dart';
import '../screens/vendor/vendor_order_screens.dart';
import '../screens/vendor/vendor_settings_screens.dart';
import '../screens/vendor/vendor_shell.dart';
import 'env.dart';

class Routes {
  // shared
  static const login = '/login';
  static const register = '/register';
  static const otp = '/otp';
  static const forgotPassword = '/forgot-password';
  static const maintenance = '/maintenance';
  static const settings = '/settings';
  static const language = '/language';
  static const legal = '/legal';
  static const notifications = '/notifications';
  static const editProfile = '/edit-profile';
  static const changePassword = '/change-password';

  // customer
  static const onboarding = '/onboarding';
  static const home = '/home';
  static const search = '/search';
  static const restaurant = '/restaurant';
  static const cart = '/cart';
  static const addresses = '/addresses';
  static const addAddress = '/addresses/add';
  static const payment = '/payment';
  static const orderConfirmation = '/order-confirmation';
  static const tracking = '/tracking';
  static const orders = '/orders';
  static const favorites = '/favorites';
  static const review = '/review';
  static const wallet = '/wallet';
  static const referral = '/referral';
  static const offers = '/offers';

  // vendor
  static const vendorHome = '/vendor';
  static const vendorOrder = '/vendor/order';
  static const vendorItemForm = '/vendor/item';
  static const vendorCategories = '/vendor/categories';
  static const vendorTimings = '/vendor/timings';
  static const vendorEarnings = '/vendor/earnings';
  static const vendorProfile = '/vendor/profile';

  // delivery
  static const deliveryHome = '/delivery';
  static const deliveryOrder = '/delivery/order';
  static const activeDelivery = '/delivery/active';
  static const deliveryComplete = '/delivery/complete';
  static const deliveryEarnings = '/delivery/earnings';
  static const deliveryHistory = '/delivery/history';
  static const deliveryProfile = '/delivery/profile';

  static String get homeForFlavor => switch (Env.flavor) {
        AppFlavor.customer => home,
        AppFlavor.vendor => vendorHome,
        AppFlavor.delivery => deliveryHome,
      };

  static Route<dynamic> generate(RouteSettings s) {
    final a = s.arguments;
    Widget page = switch (s.name) {
      login => const LoginScreen(),
      register => const RegisterScreen(),
      otp => OtpScreen(phone: a as String),
      forgotPassword => const ForgotPasswordScreen(),
      maintenance => const MaintenanceScreen(),
      settings => const SettingsScreen(),
      language => const LanguageScreen(),
      legal => LegalScreen(page: a as String),
      notifications => const NotificationsScreen(),
      editProfile => const EditProfileScreen(),
      changePassword => const ChangePasswordScreen(),
      onboarding => const OnboardingScreen(),
      home => const CustomerShell(),
      search => SearchScreen(args: (a as Map<String, dynamic>?) ?? const {}),
      restaurant => RestaurantDetailScreen(restaurantId: a as String),
      cart => const CartScreen(),
      addresses => AddressListScreen(selectMode: a == true),
      addAddress => AddAddressScreen(existing: a),
      payment => const PaymentScreen(),
      orderConfirmation => OrderConfirmationScreen(orderId: a as String),
      tracking => OrderTrackingScreen(orderId: a as String),
      orders => const OrderHistoryScreen(),
      favorites => const FavoritesScreen(),
      review => RateReviewScreen(orderId: a as String),
      wallet => const WalletScreen(),
      referral => const ReferralScreen(),
      offers => const OffersScreen(),
      vendorHome => const VendorShell(),
      vendorOrder => VendorOrderDetailScreen(orderId: a as String),
      vendorItemForm => VendorItemFormScreen(item: a),
      vendorCategories => const VendorCategoriesScreen(),
      vendorTimings => const VendorTimingsScreen(),
      vendorEarnings => const VendorEarningsScreen(),
      vendorProfile => const VendorRestaurantProfileScreen(),
      deliveryHome => const DeliveryShell(),
      deliveryOrder => DeliveryOrderDetailScreen(orderId: a as String),
      activeDelivery => const ActiveDeliveryScreen(),
      deliveryComplete => DeliveryCompleteScreen(orderId: a as String),
      deliveryEarnings => const DeliveryEarningsScreen(),
      deliveryHistory => const DeliveryHistoryScreen(),
      deliveryProfile => const DeliveryProfileScreen(),
      _ => const MaintenanceScreen(),
    };
    return MaterialPageRoute(builder: (_) => page, settings: s);
  }
}
