import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shimmer/shimmer.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

const String apiBaseUrl = 'http://192.168.0.65:3000';

void main() => runApp(const QuickCartApp());

class QuickCartApp extends StatelessWidget {
  const QuickCartApp({super.key});

  @override
  Widget build(BuildContext context) {
    SystemChrome.setSystemUIOverlayStyle(
      const SystemUiOverlayStyle(statusBarColor: Colors.transparent, statusBarIconBrightness: Brightness.light),
    );
    return MaterialApp(
      title: 'QuickCart',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: const Color(0xFF6C0BA0),
        brightness: Brightness.light,
        scaffoldBackgroundColor: const Color(0xFFF8F6FE),
        textTheme: GoogleFonts.poppinsTextTheme(),
        appBarTheme: const AppBarTheme(elevation: 0, centerTitle: false, backgroundColor: Color(0xFF6C0BA0), foregroundColor: Colors.white),
        cardTheme: CardTheme(elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)), color: Colors.white),
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: const Color(0xFF6C0BA0),
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF1A1A2E),
        textTheme: GoogleFonts.poppinsTextTheme(ThemeData.dark().textTheme),
        appBarTheme: const AppBarTheme(elevation: 0, centerTitle: false, backgroundColor: Color(0xFF16213E), foregroundColor: Colors.white),
        cardTheme: CardTheme(elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)), color: const Color(0xFF0F3460)),
      ),
      themeMode: ThemeMode.system,
      home: const SplashScreen(),
    );
  }
}

// ============ MODELS ============
class Product {
  final int id;
  final String name, category;
  final double price;
  final Color color;
  bool isFavorite;
  
  Product({required this.id, required this.name, required this.category, required this.price, required this.color, this.isFavorite = false});
  
  factory Product.fromJson(Map<String, dynamic> j) {
    final name = j['name'] as String;
    return Product(id: j['id'], name: name, category: j['category'] ?? 'General', price: double.parse(j['price'].toString()), color: _color(name));
  }
  
  static Color _color(String n) => {
    'banana': const Color(0xFFFFE135), 'milk': const Color(0xFFE8F5E9), 'bread': const Color(0xFFFFF3E0),
    'eggs (6 pcs)': const Color(0xFFFFF9C4), 'tomato': const Color(0xFFFFCDD2), 'onion': const Color(0xFFE1BEE7),
    'coca cola': const Color(0xFFFFCDD2), 'potato chips': const Color(0xFFFFF9C4)
  }[n.toLowerCase()] ?? Colors.grey.shade300;
}

class Address {
  final String id, label, address;
  final bool isDefault;
  Address({required this.id, required this.label, required this.address, this.isDefault = false});
}

// ============ SPLASH SCREEN ============
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(seconds: 2), () async {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('token');
      if (mounted) {
        Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => token != null && token!.isNotEmpty ? const MainScreen() : const LoginScreen()));
      }
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF6C0BA0),
      body: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Container(width: 100, height: 100, decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(25)), child: const Icon(Icons.shopping_bag, size: 50, color: Color(0xFF6C0BA0))).animate().scale(duration: 800.ms).then().shake(),
        const SizedBox(height: 24),
        Text('QuickCart', style: GoogleFonts.poppins(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white)),
        const SizedBox(height: 8),
        Text('Groceries in minutes', style: GoogleFonts.poppins(fontSize: 14, color: Colors.white70)),
      ])),
    );
  }
}

// ============ LOGIN SCREEN ============
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phoneCtrl = TextEditingController();
  bool _loading = false;

  Future<void> _sendOtp() async {
    final phone = _phoneCtrl.text.trim();
    if (phone.length < 10) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter valid phone number'))); return; }
    setState(() => _loading = true);
    try {
      final res = await http.post(Uri.parse('$apiBaseUrl/api/auth/send-otp'), headers: {'Content-Type': 'application/json'}, body: json.encode({'phone': phone}));
      if (res.statusCode == 200) {
        final data = json.decode(res.body);
        if (mounted) Navigator.push(context, MaterialPageRoute(builder: (_) => OtpScreen(phone: phone, otp: data['otp'])));
      }
    } catch (e) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'))); }
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).primaryColor,
      body: SafeArea(child: Center(child: SingleChildScrollView(padding: const EdgeInsets.all(32), child: Column(children: [
        const Icon(Icons.shopping_bag, size: 80, color: Colors.white),
        const SizedBox(height: 24),
        Text('Welcome!', style: GoogleFonts.poppins(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
        const SizedBox(height: 40),
        TextField(controller: _phoneCtrl, keyboardType: TextInputType.phone, maxLength: 10, style: const TextStyle(color: Colors.white, fontSize: 18), decoration: InputDecoration(labelText: 'Phone Number', labelStyle: const TextStyle(color: Colors.white70), prefixText: '+91 ', prefixStyle: const TextStyle(color: Colors.white, fontSize: 18), counterStyle: const TextStyle(color: Colors.white54), enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Colors.white30)), focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Colors.white)))),
        const SizedBox(height: 32),
        SizedBox(width: double.infinity, height: 56, child: ElevatedButton(onPressed: _loading ? null : _sendOtp, style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: Theme.of(context).primaryColor), child: _loading ? const CircularProgressIndicator() : Text('Send OTP', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600)))),
      ])))),
    );
  }
}

// ============ OTP SCREEN ============
class OtpScreen extends StatefulWidget {
  final String phone, otp;
  const OtpScreen({super.key, required this.phone, required this.otp});
  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final _otpCtrl = TextEditingController();
  bool _loading = false;

  Future<void> _verifyOtp() async {
    if (_otpCtrl.text.trim().length != 6) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter valid OTP'))); return; }
    setState(() => _loading = true);
    try {
      final res = await http.post(Uri.parse('$apiBaseUrl/api/auth/verify-otp'), headers: {'Content-Type': 'application/json'}, body: json.encode({'phone': widget.phone, 'otp': _otpCtrl.text.trim()}));
      if (res.statusCode == 200) {
        final data = json.decode(res.body);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('token', data['token']);
        await prefs.setInt('userId', data['user']['id']);
        if (mounted) Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const MainScreen()), (route) => false);
      }
    } catch (e) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'))); }
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Theme.of(context).primaryColor,
      body: SafeArea(child: Padding(padding: const EdgeInsets.all(32), child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Text('Enter OTP', style: GoogleFonts.poppins(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
        const SizedBox(height: 8),
        Text('Sent to ${widget.phone} (Dev: ${widget.otp})', style: const TextStyle(color: Colors.white70)),
        const SizedBox(height: 40),
        TextField(controller: _otpCtrl, keyboardType: TextInputType.number, maxLength: 6, style: const TextStyle(color: Colors.white, fontSize: 24, letterSpacing: 8), textAlign: TextAlign.center, decoration: InputDecoration(counterStyle: const TextStyle(color: Colors.white54), enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Colors.white30)), focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Colors.white)))),
        const SizedBox(height: 32),
        SizedBox(width: double.infinity, height: 56, child: ElevatedButton(onPressed: _loading ? null : _verifyOtp, style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: Theme.of(context).primaryColor), child: _loading ? const CircularProgressIndicator() : Text('Verify OTP', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600)))),
      ]))),
    );
  }
}

// ============ MAIN SCREEN ============
class MainScreen extends StatefulWidget {
  const MainScreen({super.key});
  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;
  final _pages = const [ShopPage(), OrdersPage(), FavoritesPage(), ProfilePage()];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _pages[_currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.store), label: 'Shop'),
          NavigationDestination(icon: Icon(Icons.receipt_long), label: 'Orders'),
          NavigationDestination(icon: Icon(Icons.favorite), label: 'Favorites'),
          NavigationDestination(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}

// ============ SHOP PAGE (with Banners) ============
class ShopPage extends StatefulWidget {
  const ShopPage({super.key});
  @override
  State<ShopPage> createState() => _ShopPageState();
}

class _ShopPageState extends State<ShopPage> {
  final Map<String, int> _cart = {};
  List<Product> _products = [], _filtered = [];
  bool _loading = true;
  String _selectedCategory = 'All';
  late Razorpay _razorpay;
  final _searchCtrl = TextEditingController();
  List<Address> _addresses = [Address(id: '1', label: 'Home', address: '123 Main St, Mumbai', isDefault: true)];
  Address? _selectedAddress;
  List<dynamic> _banners = [];

  final _categories = [
    {'name': 'All', 'icon': Icons.grid_view}, {'name': 'Fruits', 'icon': Icons.apple},
    {'name': 'Dairy', 'icon': Icons.egg}, {'name': 'Bakery', 'icon': Icons.bakery_dining},
    {'name': 'Vegetables', 'icon': Icons.eco}, {'name': 'Beverages', 'icon': Icons.local_drink},
    {'name': 'Snacks', 'icon': Icons.cookie},
  ];

  int get _cartCount => _cart.values.fold(0, (a, b) => a + b);

  Future<String> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token') ?? '';
  }

  @override
  void initState() {
    super.initState();
    _fetchProducts();
    _fetchBanners();
    _selectedAddress = _addresses.first;
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, (r) => _placeOrderAfterPayment(r.paymentId ?? ''));
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, (r) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Payment failed: ${r.message}'))));
  }

  @override
  void dispose() { _razorpay.clear(); _searchCtrl.dispose(); super.dispose(); }

  Future<void> _fetchProducts() async {
    try {
      final res = await http.get(Uri.parse('$apiBaseUrl/api/products'));
      if (res.statusCode == 200) {
        final data = json.decode(res.body).map<Product>((j) => Product.fromJson(j)).toList();
        final prefs = await SharedPreferences.getInstance();
        final favs = prefs.getStringList('favorites') ?? [];
        for (var p in data) { if (favs.contains(p.name)) p.isFavorite = true; }
        setState(() { _products = data; _filtered = data; _loading = false; });
      }
    } catch (e) { setState(() => _loading = false); }
  }

  Future<void> _fetchBanners() async {
    try {
      final res = await http.get(Uri.parse('$apiBaseUrl/api/banners'));
      if (res.statusCode == 200) setState(() => _banners = json.decode(res.body));
    } catch (_) {}
  }

  void _filter() {
    setState(() {
      _filtered = _products.where((p) => (_selectedCategory == 'All' || p.category == _selectedCategory) && (_searchCtrl.text.isEmpty || p.name.toLowerCase().contains(_searchCtrl.text.toLowerCase()))).toList();
    });
  }

  void _addToCart(Product p) => setState(() => _cart[p.name] = (_cart[p.name] ?? 0) + 1);
  
  void _removeFromCart(Product p) => setState(() {
    if (_cart.containsKey(p.name) && _cart[p.name]! > 1) { _cart[p.name] = _cart[p.name]! - 1; } else { _cart.remove(p.name); }
  });

  Future<void> _toggleFavorite(Product p) async {
    setState(() => p.isFavorite = !p.isFavorite);
    final prefs = await SharedPreferences.getInstance();
    final favs = prefs.getStringList('favorites') ?? [];
    if (p.isFavorite) { favs.add(p.name); } else { favs.remove(p.name); }
    await prefs.setStringList('favorites', favs);
  }

  Future<void> _placeOrderAfterPayment(String paymentId) async {
    final token = await _getToken();
    final items = _cart.entries.map((e) => {'product_id': _products.firstWhere((p) => p.name == e.key).id, 'quantity': e.value}).toList();
    try {
      final res = await http.post(Uri.parse('$apiBaseUrl/api/orders'), headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'}, body: json.encode({'items': items, 'delivery_address': _selectedAddress?.address ?? '123 Main St'}));
      if (res.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Order placed! Payment: $paymentId')));
        setState(() => _cart.clear());
      }
    } catch (e) { ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Order failed: $e'))); }
  }

  Future<void> _placeOrder() async {
    final token = await _getToken();
    if (token.isEmpty) return;
    
    final addr = await showDialog<Address>(context: context, builder: (ctx) => AlertDialog(
      title: const Text('Select Address'),
      content: Column(mainAxisSize: MainAxisSize.min, children: _addresses.map((a) => ListTile(title: Text(a.label), subtitle: Text(a.address), leading: Radio<Address>(value: a, groupValue: _selectedAddress, onChanged: (v) { setState(() => _selectedAddress = v); Navigator.pop(ctx, v); }))).toList()),
      actions: [TextButton(onPressed: () => Navigator.pop(ctx, _selectedAddress), child: const Text('Close'))],
    ));
    if (addr != null) _selectedAddress = addr;
    
    final action = await showDialog<String>(context: context, builder: (ctx) => AlertDialog(title: const Text('Choose Payment'), actions: [TextButton(onPressed: () => Navigator.pop(ctx, 'cod'), child: const Text('💰 COD')), ElevatedButton(onPressed: () => Navigator.pop(ctx, 'razorpay'), child: const Text('🧪 Pay Online'))]));
    if (action == 'cod') { _placeOrderAfterPayment('test_cod'); return; }
    if (action == 'razorpay') {
      double total = 0;
      for (final e in _cart.entries) { final p = _products.firstWhere((x) => x.name == e.key); total += p.price * e.value; }
      final amount = (total * 100).toInt();
      final res = await http.post(Uri.parse('$apiBaseUrl/api/payment/create-order'), headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'}, body: json.encode({'amount': amount, 'currency': 'INR'}));
      if (res.statusCode == 200) {
        final data = json.decode(res.body);
        _razorpay.open({'key': 'rzp_test_TCzpDsuYcI2co3', 'amount': amount, 'name': 'QuickCart', 'order_id': data['razorpayOrderId'], 'prefill': {'contact': '9999999999'}, 'theme': {'color': '#6C0BA0'}});
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(children: [const Icon(Icons.location_on, size: 20), const SizedBox(width: 4), Text(_selectedAddress?.label ?? 'Home', style: GoogleFonts.poppins(fontSize: 16))]),
        actions: [
          IconButton(icon: const Icon(Icons.add_location), onPressed: () async {
            final labelCtrl = TextEditingController();
            final addrCtrl = TextEditingController();
            final result = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(title: const Text('Add Address'), content: Column(mainAxisSize: MainAxisSize.min, children: [TextField(controller: labelCtrl, decoration: const InputDecoration(labelText: 'Label (Home/Work)')), TextField(controller: addrCtrl, decoration: const InputDecoration(labelText: 'Address'))]), actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')), ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Add'))]));
            if (result == true) setState(() => _addresses.add(Address(id: DateTime.now().toString(), label: labelCtrl.text, address: addrCtrl.text)));
          }),
          Stack(children: [
            IconButton(icon: const Icon(Icons.shopping_bag), onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => CartPage(cart: _cart, products: _products, onRemove: _removeFromCart, onAdd: _addToCart, onPlaceOrder: _placeOrder)))),
            if (_cartCount > 0) Positioned(right: 6, top: 2, child: Container(padding: const EdgeInsets.all(4), decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle), child: Text('$_cartCount', style: const TextStyle(color: Colors.white, fontSize: 10)))),
          ]),
        ],
      ),
      body: _loading
          ? _shimmerGrid()
          : RefreshIndicator(
              onRefresh: _fetchProducts,
              child: CustomScrollView(slivers: [
                // Search bar
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: TextField(
                      controller: _searchCtrl,
                      onChanged: (_) => _filter(),
                      decoration: InputDecoration(hintText: 'Search products...', prefixIcon: const Icon(Icons.search), filled: true, fillColor: Theme.of(context).cardColor, border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none)),
                    ),
                  ),
                ),
                // Banners carousel
                if (_banners.isNotEmpty)
                  SliverToBoxAdapter(
                    child: SizedBox(
                      height: 140,
                      child: PageView.builder(
                        itemCount: _banners.length,
                        itemBuilder: (_, i) {
                          final b = _banners[i];
                          return Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            child: GestureDetector(
                              onTap: () {},
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(16),
                                child: Image.network(
                                  b['image_url'],
                                  fit: BoxFit.cover,
                                  width: double.infinity,
                                  errorBuilder: (_, __, ___) => Container(
                                    color: Colors.grey.shade200,
                                    child: const Icon(Icons.broken_image, size: 40),
                                  ),
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                // Categories
                SliverToBoxAdapter(
                  child: SizedBox(height: 100, child: ListView.builder(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 16), itemCount: _categories.length, itemBuilder: (_, i) {
                    final cat = _categories[i];
                    final sel = _selectedCategory == cat['name'];
                    return Padding(padding: const EdgeInsets.only(right: 12), child: GestureDetector(onTap: () => setState(() { _selectedCategory = cat['name'] as String; _filter(); }), child: AnimatedContainer(duration: const Duration(milliseconds: 300), width: 80, decoration: BoxDecoration(color: sel ? const Color(0xFF6C0BA0) : Theme.of(context).cardColor, borderRadius: BorderRadius.circular(16), boxShadow: sel ? [BoxShadow(color: const Color(0xFF6C0BA0).withOpacity(0.3), blurRadius: 10)] : null), child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(cat['icon'] as IconData, color: sel ? Colors.white : const Color(0xFF6C0BA0), size: 28), const SizedBox(height: 4), Text(cat['name'] as String, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: sel ? Colors.white : Colors.black87))]))));
                  })),
                ),
                // Products grid
                SliverPadding(
                  padding: const EdgeInsets.all(16),
                  sliver: SliverGrid(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, childAspectRatio: 0.72, crossAxisSpacing: 12, mainAxisSpacing: 12),
                    delegate: SliverChildBuilderDelegate(
                      (_, index) => _productCard(_filtered[index]).animate().fadeIn(duration: 400.ms, delay: (index * 100).ms).slideY(begin: 0.1, end: 0),
                      childCount: _filtered.length,
                    ),
                  ),
                ),
              ]),
            ),
    );
  }

  Widget _shimmerGrid() => GridView.builder(padding: const EdgeInsets.all(16), gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, childAspectRatio: 0.72, crossAxisSpacing: 12, mainAxisSpacing: 12), itemCount: 6, itemBuilder: (_, __) => Shimmer.fromColors(baseColor: Colors.grey.shade200, highlightColor: Colors.grey.shade100, child: Container(decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)))));

  Widget _productCard(Product p) {
    final inCart = _cart.containsKey(p.name);
    return Card(
      child: Stack(children: [
        Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Expanded(child: Container(decoration: BoxDecoration(gradient: LinearGradient(colors: [p.color.withOpacity(0.3), p.color]), borderRadius: const BorderRadius.vertical(top: Radius.circular(16))), child: Center(child: Icon(Icons.shopping_basket, size: 40, color: Colors.white.withOpacity(0.5))))),
          Padding(padding: const EdgeInsets.all(12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(p.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14), maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 2),
            Text(p.category, style: TextStyle(color: Colors.grey.shade500, fontSize: 11)),
            const SizedBox(height: 6),
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('₹${p.price.toStringAsFixed(0)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF6C0BA0))),
              if (!inCart) Material(color: const Color(0xFF6C0BA0), borderRadius: BorderRadius.circular(8), child: InkWell(onTap: () => _addToCart(p), borderRadius: BorderRadius.circular(8), child: const Padding(padding: EdgeInsets.all(6), child: Icon(Icons.add, color: Colors.white, size: 18))))
              else Row(children: [GestureDetector(onTap: () => _removeFromCart(p), child: const Icon(Icons.remove_circle, color: Color(0xFF6C0BA0), size: 20)), Padding(padding: const EdgeInsets.symmetric(horizontal: 8), child: Text('${_cart[p.name]}', style: const TextStyle(fontWeight: FontWeight.w600))), GestureDetector(onTap: () => _addToCart(p), child: const Icon(Icons.add_circle, color: Color(0xFF6C0BA0), size: 20))]),
            ]),
          ])),
        ]),
        Positioned(top: 8, right: 8, child: GestureDetector(onTap: () => _toggleFavorite(p), child: Icon(p.isFavorite ? Icons.favorite : Icons.favorite_border, color: p.isFavorite ? Colors.red : Colors.white, size: 22))),
      ]),
    );
  }
}

// ============ CART PAGE ============
class CartPage extends StatelessWidget {
  final Map<String, int> cart;
  final List<Product> products;
  final Function(Product) onRemove, onAdd;
  final VoidCallback onPlaceOrder;

  const CartPage({super.key, required this.cart, required this.products, required this.onRemove, required this.onAdd, required this.onPlaceOrder});

  @override
  Widget build(BuildContext context) {
    final items = products.where((p) => cart.containsKey(p.name)).toList();
    final total = items.fold<double>(0, (s, p) => s + (p.price * cart[p.name]!));
    return Scaffold(
      appBar: AppBar(title: const Text('Your Cart')),
      body: items.isEmpty
          ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [const Icon(Icons.shopping_cart_outlined, size: 80, color: Colors.grey), const SizedBox(height: 16), Text('Your cart is empty', style: GoogleFonts.poppins(fontSize: 16, color: Colors.grey))]))
          : Column(children: [
              Expanded(child: ListView.builder(itemCount: items.length, itemBuilder: (_, i) {
                final p = items[i], q = cart[p.name]!;
                return Card(margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4), child: Padding(padding: const EdgeInsets.all(12), child: Row(children: [
                  Container(width: 60, height: 60, decoration: BoxDecoration(borderRadius: BorderRadius.circular(12), color: p.color.withOpacity(0.3))),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(p.name, style: const TextStyle(fontWeight: FontWeight.w600)), Text('₹${p.price.toStringAsFixed(0)}', style: const TextStyle(color: Color(0xFF6C0BA0)))])),
                  Row(children: [IconButton(icon: const Icon(Icons.remove_circle_outline), onPressed: () => onRemove(p)), Text('$q', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16)), IconButton(icon: const Icon(Icons.add_circle_outline), onPressed: () => onAdd(p))]),
                ])));
              })),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(color: Theme.of(context).cardColor, boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 20, offset: const Offset(0, -5))]),
                child: SafeArea(
                  child: Row(children: [
                    Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('Total', style: TextStyle(color: Colors.grey.shade500)),
                      Text('₹${total.toStringAsFixed(0)}', style: GoogleFonts.poppins(fontSize: 24, fontWeight: FontWeight.bold, color: const Color(0xFF6C0BA0))),
                    ]),
                    const Spacer(),
                    ElevatedButton(onPressed: onPlaceOrder, style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 16)), child: const Text('Place Order', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600))),
                  ]),
                ),
              ),
            ]),
    );
  }
}

// ============ ORDERS PAGE ============
class OrdersPage extends StatefulWidget {
  const OrdersPage({super.key});
  @override
  State<OrdersPage> createState() => _OrdersPageState();
}

class _OrdersPageState extends State<OrdersPage> {
  List<dynamic> _orders = [];
  bool _loading = true;
  IO.Socket? _socket;
  String _statusFilter = 'All';

  Future<String> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token') ?? '';
  }

  @override
  void initState() {
    super.initState();
    _fetchOrders();
    _connectSocket();
  }

  Future<void> _connectSocket() async {
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getInt('userId');
    if (userId == null) return;
    _socket = IO.io(apiBaseUrl, <String, dynamic>{'transports': ['websocket'], 'autoConnect': true});
    _socket!.onConnect((_) => _socket!.emit('join', userId));
    _socket!.on('orderStatusChanged', (data) {
      if (!mounted) return;
      setState(() { final idx = _orders.indexWhere((o) => o['id'] == data['orderId']); if (idx != -1) _orders[idx]['status'] = data['status']; });
    });
  }

  @override
  void dispose() { _socket?.disconnect(); super.dispose(); }

  Future<void> _fetchOrders() async {
    final token = await _getToken();
    try {
      final res = await http.get(Uri.parse('$apiBaseUrl/api/orders'), headers: {'Authorization': 'Bearer $token'});
      if (res.statusCode == 200) setState(() { _orders = json.decode(res.body); _loading = false; });
    } catch (e) { setState(() => _loading = false); }
  }

  Future<void> _cancelOrder(int orderId) async {
    final token = await _getToken();
    await http.put(
      Uri.parse('$apiBaseUrl/api/admin/orders/$orderId/status'),
      headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
      body: json.encode({'status': 'cancelled'}),
    );
    _fetchOrders();
  }

  Color _statusColor(String s) => {'placed': Colors.orange, 'packed': Colors.blue, 'assigned': Colors.purple, 'picked_up': Colors.teal, 'delivered': Colors.green, 'cancelled': Colors.red}[s] ?? Colors.grey;
  double _progress(String s) => {'placed': 0.2, 'packed': 0.4, 'assigned': 0.6, 'picked_up': 0.8, 'delivered': 1.0, 'cancelled': 0.0}[s] ?? 0.0;

  @override
  Widget build(BuildContext context) {
    final filtered = _statusFilter == 'All' ? _orders : _orders.where((o) => o['status'] == _statusFilter).toList();
    return Scaffold(
      appBar: AppBar(title: const Text('My Orders')),
      body: Column(children: [
        SingleChildScrollView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.all(8), child: Row(children: ['All', 'placed', 'packed', 'assigned', 'picked_up', 'delivered'].map((s) => Padding(padding: const EdgeInsets.symmetric(horizontal: 4), child: FilterChip(label: Text(s), selected: _statusFilter == s, onSelected: (v) { setState(() => _statusFilter = v ? s : 'All'); }))).toList())),
        Expanded(child: _loading ? const Center(child: CircularProgressIndicator()) : filtered.isEmpty ? Center(child: Text('No orders found', style: GoogleFonts.poppins(fontSize: 16, color: Colors.grey))) : RefreshIndicator(onRefresh: _fetchOrders, child: ListView.builder(padding: const EdgeInsets.all(16), itemCount: filtered.length, itemBuilder: (_, i) {
          final o = filtered[i];
          return Card(margin: const EdgeInsets.only(bottom: 12), child: Padding(padding: const EdgeInsets.all(16), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [Text('Order #${o['id']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)), Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4), decoration: BoxDecoration(color: _statusColor(o['status']).withOpacity(0.1), borderRadius: BorderRadius.circular(20)), child: Text(o['status'], style: TextStyle(color: _statusColor(o['status']), fontSize: 12, fontWeight: FontWeight.w500)))]),
            const SizedBox(height: 8),
            Text('Total: ₹${o['total_amount']}'),
            const SizedBox(height: 8),
            LinearProgressIndicator(value: _progress(o['status']), backgroundColor: Colors.grey.shade200, valueColor: const AlwaysStoppedAnimation(Color(0xFF6C0BA0))),
            if (o['status'] == 'placed') ...[const SizedBox(height: 8), SizedBox(width: double.infinity, child: OutlinedButton(onPressed: () => _cancelOrder(o['id']), style: OutlinedButton.styleFrom(foregroundColor: Colors.red), child: const Text('Cancel Order')))],
          ])));
        }))),
      ]),
    );
  }
}

// ============ FAVORITES PAGE ============
class FavoritesPage extends StatefulWidget {
  const FavoritesPage({super.key});
  @override
  State<FavoritesPage> createState() => _FavoritesPageState();
}

class _FavoritesPageState extends State<FavoritesPage> {
  List<String> _favorites = [];
  List<Product> _allProducts = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadFavorites();
  }

  Future<void> _loadFavorites() async {
    final prefs = await SharedPreferences.getInstance();
    _favorites = prefs.getStringList('favorites') ?? [];
    try {
      final res = await http.get(Uri.parse('$apiBaseUrl/api/products'));
      if (res.statusCode == 200) {
        _allProducts = json.decode(res.body).map<Product>((j) => Product.fromJson(j)).toList();
        for (var p in _allProducts) { p.isFavorite = _favorites.contains(p.name); }
        setState(() => _loading = false);
      }
    } catch (e) { setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    final favProducts = _allProducts.where((p) => p.isFavorite).toList();
    return Scaffold(
      appBar: AppBar(title: const Text('My Favorites')),
      body: _loading ? const Center(child: CircularProgressIndicator()) : favProducts.isEmpty ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [const Icon(Icons.favorite_border, size: 80, color: Colors.grey), const SizedBox(height: 16), Text('No favorites yet', style: GoogleFonts.poppins(fontSize: 16, color: Colors.grey))])) : GridView.builder(padding: const EdgeInsets.all(16), gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, childAspectRatio: 0.8, crossAxisSpacing: 12, mainAxisSpacing: 12), itemCount: favProducts.length, itemBuilder: (_, i) {
        final p = favProducts[i];
        return Card(child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Expanded(child: Container(decoration: BoxDecoration(gradient: LinearGradient(colors: [p.color.withOpacity(0.3), p.color]), borderRadius: const BorderRadius.vertical(top: Radius.circular(16))), child: Center(child: Icon(Icons.favorite, size: 40, color: Colors.red.withOpacity(0.5))))),
          Padding(padding: const EdgeInsets.all(12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(p.name, style: const TextStyle(fontWeight: FontWeight.w600)), Text('₹${p.price.toStringAsFixed(0)}', style: const TextStyle(color: Color(0xFF6C0BA0), fontWeight: FontWeight.bold))])),
        ]));
      }),
    );
  }
}

// ============ PROFILE PAGE ============
class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        const SizedBox(height: 20),
        const CircleAvatar(radius: 50, backgroundColor: Color(0xFF6C0BA0), child: Icon(Icons.person, size: 50, color: Colors.white)),
        const SizedBox(height: 16),
        Text('Welcome!', style: GoogleFonts.poppins(fontSize: 20, fontWeight: FontWeight.w600), textAlign: TextAlign.center),
        const SizedBox(height: 32),
        ListTile(leading: const Icon(Icons.dark_mode), title: const Text('Dark Mode'), trailing: Switch(value: Theme.of(context).brightness == Brightness.dark, onChanged: (v) async { final prefs = await SharedPreferences.getInstance(); await prefs.setBool('isDark', v); })),
        ListTile(leading: const Icon(Icons.history), title: const Text('Order History'), onTap: () {}),
        ListTile(leading: const Icon(Icons.location_on), title: const Text('Saved Addresses'), onTap: () {}),
        ListTile(leading: const Icon(Icons.share), title: const Text('Share App'), onTap: () {}),
        ListTile(leading: const Icon(Icons.star), title: const Text('Rate Us'), onTap: () {}),
        const Divider(),
        ListTile(leading: const Icon(Icons.logout, color: Colors.red), title: const Text('Logout', style: TextStyle(color: Colors.red)), onTap: () async { final prefs = await SharedPreferences.getInstance(); await prefs.clear(); if (context.mounted) Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const LoginScreen()), (route) => false); }),
      ]),
    );
  }
}