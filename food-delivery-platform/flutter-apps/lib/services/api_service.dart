import '../core/api_client.dart';
import '../models/json_utils.dart';

/// Typed endpoint catalogue shared by all three flavors.
class ApiService {
  ApiService._();
  static final ApiService instance = ApiService._();
  final ApiClient _api = ApiClient.instance;

  // ---------- Restaurants ----------
  Future<Map<String, dynamic>> restaurants(Map<String, dynamic> query) async => toMap(await _api.get('/restaurants', query: query));
  Future<Map<String, dynamic>> restaurant(String id) async => toMap(await _api.get('/restaurants/$id'));
  Future<Map<String, dynamic>> menu(String id, {bool vegOnly = false, String? q}) async =>
      toMap(await _api.get('/restaurants/$id/menu', query: {'veg': vegOnly ? 'true' : null, 'q': q}));
  Future<Map<String, dynamic>> reviews(String restaurantId, {int page = 1}) async =>
      toMap(await _api.get('/reviews/restaurant/$restaurantId', query: {'page': page}));

  // ---------- Profile ----------
  Future<Map<String, dynamic>> profile() async => toMap(await _api.get('/users/profile'));
  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async => toMap(await _api.put('/users/profile', data: data));
  Future<void> deleteAccount() => _api.delete('/users/profile');
  Future<void> changePassword(String current, String next) => _api.put('/users/change-password', data: {'currentPassword': current, 'newPassword': next});
  Future<void> registerFcmToken(String token) => _api.post('/users/fcm-token', data: {'token': token});
  Future<List<dynamic>> addresses() async => toList(await _api.get('/users/addresses'));
  Future<List<dynamic>> addAddress(Map<String, dynamic> data) async => toList(await _api.post('/users/addresses', data: data));
  Future<List<dynamic>> updateAddress(String id, Map<String, dynamic> data) async => toList(await _api.put('/users/addresses/$id', data: data));
  Future<List<dynamic>> deleteAddress(String id) async => toList(await _api.delete('/users/addresses/$id'));
  Future<List<dynamic>> favorites() async => toList(await _api.get('/users/favorites'));
  Future<Map<String, dynamic>> toggleFavorite(String restaurantId) async => toMap(await _api.post('/users/favorites/$restaurantId'));
  Future<Map<String, dynamic>> wallet({int page = 1}) async => toMap(await _api.get('/users/wallet', query: {'page': page}));
  Future<Map<String, dynamic>> referral() async => toMap(await _api.get('/users/referral'));

  // ---------- Coupons ----------
  Future<List<dynamic>> availableCoupons({String? restaurantId}) async => toList(await _api.get('/coupons/available', query: {'restaurantId': restaurantId}));

  // ---------- Orders (customer) ----------
  Future<Map<String, dynamic>> quote(Map<String, dynamic> body) async => toMap(await _api.post('/orders/quote', data: body));
  Future<Map<String, dynamic>> placeOrder(Map<String, dynamic> body) async => toMap(await _api.post('/orders', data: body));
  Future<Map<String, dynamic>> myOrders({int page = 1}) async => toMap(await _api.get('/orders', query: {'page': page}));
  Future<List<dynamic>> activeOrders() async => toList(await _api.get('/orders/active'));
  Future<Map<String, dynamic>> order(String id) async => toMap(await _api.get('/orders/$id'));
  Future<Map<String, dynamic>> cancelOrder(String id, String reason) async => toMap(await _api.post('/orders/$id/cancel', data: {'reason': reason}));
  Future<Map<String, dynamic>> reorder(String id) async => toMap(await _api.get('/orders/$id/reorder'));
  Future<void> review(Map<String, dynamic> body) => _api.post('/reviews', data: body);

  // ---------- Payments ----------
  Future<Map<String, dynamic>> createIntent(Map<String, dynamic> body) async => toMap(await _api.post('/payments/create-intent', data: body));
  Future<dynamic> verifyPayment(Map<String, dynamic> body) => _api.post('/payments/verify', data: body);

  // ---------- Notifications ----------
  Future<Map<String, dynamic>> notifications({int page = 1}) async => toMap(await _api.get('/notifications', query: {'page': page}));
  Future<void> markNotificationsRead() => _api.post('/notifications/read', data: {});

  // ---------- Vendor ----------
  Future<Map<String, dynamic>?> myRestaurant() async {
    final d = await _api.get('/restaurants/mine/details');
    return d == null ? null : toMap(d);
  }

  Future<Map<String, dynamic>> createRestaurant(Map<String, dynamic> body) async => toMap(await _api.post('/restaurants', data: body));
  Future<Map<String, dynamic>> updateMyRestaurant(Map<String, dynamic> body) async => toMap(await _api.put('/restaurants/mine/details', data: body));
  Future<Map<String, dynamic>> setRestaurantStatus({bool? isOpen, bool? acceptingOrders}) async => toMap(await _api
      .patch('/restaurants/mine/status', data: {if (isOpen != null) 'isOpen': isOpen, if (acceptingOrders != null) 'acceptingOrders': acceptingOrders}));
  Future<Map<String, dynamic>> updateTimings(List<Map<String, dynamic>> timings) async =>
      toMap(await _api.put('/restaurants/mine/timings', data: {'timings': timings}));
  Future<Map<String, dynamic>> vendorStats({int days = 7}) async => toMap(await _api.get('/orders/vendor/stats', query: {'days': days}));
  Future<Map<String, dynamic>> vendorOrders({String? status, int page = 1}) async =>
      toMap(await _api.get('/orders/vendor/list', query: {'status': status, 'page': page}));
  Future<Map<String, dynamic>> vendorUpdateOrder(String id, String status, {String? reason}) async =>
      toMap(await _api.patch('/orders/vendor/$id/status', data: {'status': status, if (reason != null) 'reason': reason}));
  Future<Map<String, dynamic>> vendorPayouts({int page = 1}) async => toMap(await _api.get('/orders/vendor/payouts', query: {'page': page}));
  Future<List<dynamic>> menuCategories() async => toList(await _api.get('/menu/categories'));
  Future<dynamic> createMenuCategory(Map<String, dynamic> body) => _api.post('/menu/categories', data: body);
  Future<dynamic> updateMenuCategory(String id, Map<String, dynamic> body) => _api.put('/menu/categories/$id', data: body);
  Future<dynamic> deleteMenuCategory(String id) => _api.delete('/menu/categories/$id');
  Future<List<dynamic>> menuItems({String? category}) async => toList(await _api.get('/menu/items', query: {'category': category}));
  Future<dynamic> createMenuItem(Map<String, dynamic> body) => _api.post('/menu/items', data: body);
  Future<dynamic> updateMenuItem(String id, Map<String, dynamic> body) => _api.put('/menu/items/$id', data: body);
  Future<dynamic> deleteMenuItem(String id) => _api.delete('/menu/items/$id');
  Future<dynamic> toggleItemAvailability(String id, bool available) => _api.patch('/menu/items/$id/availability', data: {'isAvailable': available});

  // ---------- Delivery ----------
  Future<Map<String, dynamic>> deliveryProfile() async => toMap(await _api.get('/delivery/profile'));
  Future<Map<String, dynamic>> registerDelivery(Map<String, dynamic> body) async => toMap(await _api.post('/delivery/register', data: body));
  Future<Map<String, dynamic>> setOnline(bool online, {double? lat, double? lng}) async =>
      toMap(await _api.patch('/delivery/online', data: {'isOnline': online, if (lat != null) 'lat': lat, if (lng != null) 'lng': lng}));
  Future<void> sendLocation(double lat, double lng, {double? heading, double? speed}) =>
      _api.post('/delivery/location', data: {'lat': lat, 'lng': lng, 'heading': heading, 'speed': speed});
  Future<Map<String, dynamic>> availableOrders() async => toMap(await _api.get('/delivery/available-orders'));
  Future<Map<String, dynamic>> acceptDelivery(String id) async => toMap(await _api.post('/delivery/orders/$id/accept'));
  Future<void> rejectDelivery(String id) => _api.post('/delivery/orders/$id/reject');
  Future<Map<String, dynamic>?> activeDelivery() async {
    final d = await _api.get('/delivery/active');
    return d == null ? null : toMap(d);
  }

  Future<Map<String, dynamic>> updateDeliveryStatus(String id, String status, {String? otp, String? photoUrl}) async =>
      toMap(await _api.patch('/delivery/orders/$id/status', data: {'status': status, if (otp != null) 'otp': otp, if (photoUrl != null) 'photoUrl': photoUrl}));
  Future<Map<String, dynamic>> deliveryHistory({int page = 1}) async => toMap(await _api.get('/delivery/history', query: {'page': page}));
  Future<Map<String, dynamic>> deliveryEarnings({int days = 7}) async => toMap(await _api.get('/delivery/earnings', query: {'days': days}));

  Future<String> upload(String path, {String folder = 'images'}) => _api.uploadImage(path, folder: folder);
}
