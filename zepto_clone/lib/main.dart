import 'package:zepto_clone/product_detail_page.dart';
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
import 'package:zepto_clone/core/theme/app_theme.dart';

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
      title: 'ZAMZA',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: ZamzaColors.primary,
          primary: ZamzaColors.primary,
          secondary: ZamzaColors.secondary,
          surface: ZamzaColors.card,
          error: ZamzaColors.error,
        ),
        scaffoldBackgroundColor: ZamzaColors.background,
        textTheme: GoogleFonts.poppinsTextTheme(),
        appBarTheme: const AppBarTheme(
          elevation: 0,
          centerTitle: false,
          backgroundColor: Colors.transparent,
          foregroundColor: ZamzaColors.accent,
        ),
        cardTheme: CardThemeData(
          elevation: 0,
          color: ZamzaColors.card,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(ZamzaRadius.md)),
          shadowColor: ZamzaShadows.card.color,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: ZamzaColors.primary,
            foregroundColor: Colors.white,
            elevation: 0,
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(ZamzaRadius.md)),
          ),
        ),
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: ZamzaColors.primary,
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: const Color(0xFF1A1A2E),
        textTheme: GoogleFonts.poppinsTextTheme(ThemeData.dark().textTheme),
        appBarTheme: const AppBarTheme(
          elevation: 0,
          centerTitle: false,
          backgroundColor: Color(0xFF16213E),
          foregroundColor: Colors.white,
        ),
        cardTheme: CardThemeData(
          elevation: 0,
          color: const Color(0xFF0F3460),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(ZamzaRadius.md)),
        ),
      ),
      themeMode: ThemeMode.system,
      home: const SplashScreen(),
    );
  }
}

// ============ MODELS ============
class Product {
  final int id;
  final String name;
  final String category;
  final double price;
  final Color color;
  final String? imageUrl;
  bool isFavorite;

  Product({
    required this.id,
    required this.name,
    required this.category,
    required this.price,
    required this.color,
    this.imageUrl,
    this.isFavorite = false,
  });

  factory Product.fromJson(Map<String, dynamic> j) {
    final name = j['name'] as String;
    return Product(
      id: j['id'],
      name: name,
      category: j['category'] ?? 'General',
      price: double.parse(j['price'].toString()),
      color: _color(name),
      imageUrl: j['image_url'],
    );
  }

  static Color _color(String n) {
    switch (n.toLowerCase()) {
      case 'banana': return const Color(0xFFFFE135);
      case 'milk': return const Color(0xFFE8F5E9);
      case 'bread': return const Color(0xFFFFF3E0);
      case 'eggs (6 pcs)': return const Color(0xFFFFF9C4);
      case 'tomato': return const Color(0xFFFFCDD2);
      case 'onion': return const Color(0xFFE1BEE7);
      case 'coca cola': return const Color(0xFFFFCDD2);
      case 'potato chips': return const Color(0xFFFFF9C4);
      default: return Colors.grey.shade300;
    }
  }
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
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [ZamzaColors.primary, ZamzaColors.secondary],
          ),
        ),
        child: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Container(
            width: 100, height: 100,
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(25)),
            child: const Icon(Icons.shopping_bag, size: 50, color: Color(0xFFFF6A00)),
          ).animate().scale(duration: 800.ms).then().shake(),
          const SizedBox(height: 24),
          Text('ZAMZA', style: GoogleFonts.poppins(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 8),
          Text('Everything. Delivered.', style: GoogleFonts.poppins(fontSize: 14, color: Colors.white70)),
        ])),
      ),
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
      backgroundColor: ZamzaColors.background,
      body: SafeArea(child: Center(child: SingleChildScrollView(padding: const EdgeInsets.all(32), child: Column(children: [
        Container(
          width: 80, height: 80,
          decoration: BoxDecoration(color: ZamzaColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(20)),
          child: const Icon(Icons.shopping_bag_outlined, size: 40, color: ZamzaColors.primary),
        ),
        const SizedBox(height: 24),
        Text('Welcome to ZAMZA', style: GoogleFonts.poppins(fontSize: 28, fontWeight: FontWeight.bold, color: ZamzaColors.accent)),
        const SizedBox(height: 40),
        TextField(
          controller: _phoneCtrl, keyboardType: TextInputType.phone, maxLength: 10,
          style: const TextStyle(fontSize: 18),
          decoration: InputDecoration(
            labelText: 'Phone Number', labelStyle: TextStyle(color: ZamzaColors.grey500),
            prefixText: '+91 ', prefixStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
            counterStyle: TextStyle(color: ZamzaColors.grey500),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: ZamzaColors.grey200)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: ZamzaColors.primary)),
          ),
        ),
        const SizedBox(height: 32),
        SizedBox(width: double.infinity, height: 56, child: ElevatedButton(onPressed: _loading ? null : _sendOtp, child: _loading ? const CircularProgressIndicator() : Text('Send OTP', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600)))),
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
      backgroundColor: ZamzaColors.background,
      body: SafeArea(child: Padding(padding: const EdgeInsets.all(32), child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Text('Enter OTP', style: GoogleFonts.poppins(fontSize: 28, fontWeight: FontWeight.bold, color: ZamzaColors.accent)),
        const SizedBox(height: 8),
        Text('Sent to ${widget.phone} (Dev: ${widget.otp})', style: TextStyle(color: ZamzaColors.grey500)),
        const SizedBox(height: 40),
        TextField(controller: _otpCtrl, keyboardType: TextInputType.number, maxLength: 6, style: const TextStyle(fontSize: 24, letterSpacing: 8), textAlign: TextAlign.center, decoration: InputDecoration(counterStyle: TextStyle(color: ZamzaColors.grey500), enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: ZamzaColors.grey200)), focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: ZamzaColors.primary)))),
        const SizedBox(height: 32),
        SizedBox(width: double.infinity, height: 56, child: ElevatedButton(onPressed: _loading ? null : _verifyOtp, child: _loading ? const CircularProgressIndicator() : Text('Verify OTP', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600)))),
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
        indicatorColor: ZamzaColors.primary.withOpacity(0.2),
        destinations: [
          NavigationDestination(icon: Icon(Icons.store, color: _currentIndex == 0 ? ZamzaColors.primary : ZamzaColors.grey500), label: 'Shop'),
          NavigationDestination(icon: Icon(Icons.receipt_long, color: _currentIndex == 1 ? ZamzaColors.primary : ZamzaColors.grey500), label: 'Orders'),
          NavigationDestination(icon: Icon(Icons.favorite, color: _currentIndex == 2 ? ZamzaColors.primary : ZamzaColors.grey500), label: 'Favorites'),
          NavigationDestination(icon: Icon(Icons.person, color: _currentIndex == 3 ? ZamzaColors.primary : ZamzaColors.grey500), label: 'Profile'),
        ],
      ),
    );
  }
}

// ============ SHOP PAGE (ZAMZA Premium Design) ============
class ShopPage extends StatefulWidget {
  const ShopPage({super.key});
  @override
  State<ShopPage> createState() => _ShopPageState();
}

class _ShopPageState extends State<ShopPage> {
  // ---- State variables ----
  final Map<String, int> _cart = {};
  List<Product> _products = [], _filtered = [];
  bool _loading = true;
  String _selectedCategory = 'All';
  late Razorpay _razorpay;
  final _searchCtrl = TextEditingController();
  List<Address> _addresses = [Address(id: '1', label: 'Home', address: '123 Main St, Mumbai', isDefault: true)];
  Address? _selectedAddress;
  List<dynamic> _banners = [];
  List<dynamic> _featuredProducts = [];
  final ScrollController _scrollController = ScrollController();
  bool _showFloatingSearch = false;

  final _categories = [
    {'name': 'All', 'icon': Icons.grid_view},
    {'name': 'Fruits', 'icon': Icons.apple},
    {'name': 'Dairy', 'icon': Icons.egg},
    {'name': 'Bakery', 'icon': Icons.bakery_dining},
    {'name': 'Vegetables', 'icon': Icons.eco},
    {'name': 'Beverages', 'icon': Icons.local_drink},
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
    _fetchFeatured();
    _selectedAddress = _addresses.first;
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, (r) => _placeOrderAfterPayment(r.paymentId ?? ''));
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, (r) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Payment failed: ${r.message}'))));
    _scrollController.addListener(() {
      if (_scrollController.offset > 120 && !_showFloatingSearch) {
        setState(() => _showFloatingSearch = true);
      } else if (_scrollController.offset <= 120 && _showFloatingSearch) {
        setState(() => _showFloatingSearch = false);
      }
    });
  }

  @override
  void dispose() {
    _razorpay.clear();
    _searchCtrl.dispose();
    _scrollController.dispose();
    super.dispose();
  }

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

  Future<void> _fetchFeatured() async {
    try {
      final res = await http.get(Uri.parse('$apiBaseUrl/api/products/featured'));
      if (res.statusCode == 200) setState(() => _featuredProducts = json.decode(res.body));
    } catch (_) {}
  }

  void _filter() {
    setState(() {
      _filtered = _products.where((p) =>
          (_selectedCategory == 'All' || p.category == _selectedCategory) &&
          (_searchCtrl.text.isEmpty || p.name.toLowerCase().contains(_searchCtrl.text.toLowerCase()))
      ).toList();
    });
  }

  void _addToCart(Product p) => setState(() => _cart[p.name] = (_cart[p.name] ?? 0) + 1);

  void _removeFromCart(Product p) => setState(() {
    if (_cart.containsKey(p.name) && _cart[p.name]! > 1) {
      _cart[p.name] = _cart[p.name]! - 1;
    } else {
      _cart.remove(p.name);
    }
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
    final items = _cart.entries.map((e) => {
      'product_id': _products.firstWhere((p) => p.name == e.key).id,
      'quantity': e.value
    }).toList();
    try {
      final res = await http.post(
        Uri.parse('$apiBaseUrl/api/orders'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
        body: json.encode({'items': items, 'delivery_address': _selectedAddress?.address ?? '123 Main St'}),
      );
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
      content: Column(mainAxisSize: MainAxisSize.min, children: _addresses.map((a) => ListTile(
        title: Text(a.label),
        subtitle: Text(a.address),
        leading: Radio<Address>(value: a, groupValue: _selectedAddress, onChanged: (v) { setState(() => _selectedAddress = v); Navigator.pop(ctx, v); })
      )).toList()),
      actions: [TextButton(onPressed: () => Navigator.pop(ctx, _selectedAddress), child: const Text('Close'))],
    ));
    if (addr != null) _selectedAddress = addr;
    final action = await showDialog<String>(context: context, builder: (ctx) => AlertDialog(
      title: const Text('Choose Payment'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, 'cod'), child: const Text('💰 COD')),
        ElevatedButton(onPressed: () => Navigator.pop(ctx, 'razorpay'), child: const Text('🧪 Pay Online')),
      ],
    ));
    if (action == 'cod') { _placeOrderAfterPayment('test_cod'); return; }
    if (action == 'razorpay') {
      double total = 0;
      for (final e in _cart.entries) {
        final p = _products.firstWhere((x) => x.name == e.key);
        total += p.price * e.value;
      }
      final amount = (total * 100).toInt();
      final res = await http.post(
        Uri.parse('$apiBaseUrl/api/payment/create-order'),
        headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
        body: json.encode({'amount': amount, 'currency': 'INR'}),
      );
      if (res.statusCode == 200) {
        final data = json.decode(res.body);
        _razorpay.open({
          'key': 'rzp_test_TCzpDsuYcI2co3',
          'amount': amount,
          'name': 'ZAMZA',
          'order_id': data['razorpayOrderId'],
          'prefill': {'contact': '9999999999'},
          'theme': {'color': '#FF6A00'}
        });
      }
    }
  }

  // ---- UI Helpers ----
  Widget _buildCategoryChip(Map<String, dynamic> cat) {
    final sel = _selectedCategory == cat['name'];
    return GestureDetector(
      onTap: () { setState(() => _selectedCategory = cat['name'] as String); _filter(); },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        decoration: BoxDecoration(
          color: sel ? ZamzaColors.primary : ZamzaColors.card,
          borderRadius: BorderRadius.circular(ZamzaRadius.xl),
          boxShadow: sel ? [BoxShadow(color: ZamzaColors.primary.withOpacity(0.3), blurRadius: 10)] : [],
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(cat['icon'] as IconData, size: 20, color: sel ? Colors.white : ZamzaColors.primary),
          const SizedBox(width: 8),
          Text(cat['name'] as String, style: TextStyle(fontWeight: FontWeight.w500, color: sel ? Colors.white : ZamzaColors.accent)),
        ]),
      ),
    );
  }

  Widget _buildFeaturedCard(dynamic p) {
    return GestureDetector(
      onTap: () {},
      child: Container(
        width: 150,
        decoration: BoxDecoration(color: ZamzaColors.card, borderRadius: BorderRadius.circular(ZamzaRadius.md), boxShadow: const [ZamzaShadows.card]),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(ZamzaRadius.md)),
            child: Image.network(p['image_url'] ?? 'https://via.placeholder.com/150', height: 100, width: double.infinity, fit: BoxFit.cover, errorBuilder: (_, __, ___) => Container(height: 100, color: ZamzaColors.grey200, child: const Icon(Icons.image, color: ZamzaColors.grey500))),
          ),
          Padding(padding: const EdgeInsets.all(8), child: Text(p['name'], style: ZamzaText.body.copyWith(fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis)),
          Padding(padding: const EdgeInsets.symmetric(horizontal: 8), child: Text('₹${p['price']}', style: ZamzaText.price)),
        ]),
      ),
    );
  }

Widget _buildProductCard(Product p) {
  final inCart = _cart.containsKey(p.name);
  return GestureDetector(
    onTap: () {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ProductDetailPage(
            product: p,
            isFavorite: p.isFavorite,
            onFavoriteToggle: () => _toggleFavorite(p),
            onAddToCart: (prod) => _addToCart(prod),
            cart: _cart,
          ),
        ),
      );
    },
    child: Container(
      decoration: BoxDecoration(
        color: ZamzaColors.card,
        borderRadius: BorderRadius.circular(ZamzaRadius.md),
        boxShadow: const [ZamzaShadows.card],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(ZamzaRadius.md)),
              child: Image.network(
                p.imageUrl ?? 'https://via.placeholder.com/300',
                height: 120,
                width: double.infinity,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(height: 120, color: ZamzaColors.grey200, child: const Icon(Icons.image, color: ZamzaColors.grey500)),
              ),
            ),
            Positioned(top: 8, left: 8, child: Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4), decoration: BoxDecoration(color: ZamzaColors.primary, borderRadius: BorderRadius.circular(12)), child: Text('20% OFF', style: ZamzaText.caption.copyWith(color: Colors.white, fontSize: 10)))),
            Positioned(top: 8, right: 8, child: GestureDetector(onTap: () => _toggleFavorite(p), child: Icon(p.isFavorite ? Icons.favorite : Icons.favorite_border, color: p.isFavorite ? Colors.red : Colors.white, size: 22))),
          ]),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(p.name, style: ZamzaText.body.copyWith(fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 4),
              Row(children: [
                const Icon(Icons.star, size: 14, color: Colors.amber),
                const SizedBox(width: 4),
                Text('4.5 (120)', style: ZamzaText.caption),
                const Spacer(),
                Text('10 min', style: ZamzaText.caption.copyWith(color: ZamzaColors.primary)),
              ]),
              const SizedBox(height: 8),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('₹${p.price.toStringAsFixed(0)}', style: ZamzaText.price),
                if (!inCart)
                  InkWell(
                    onTap: () => _addToCart(p),
                    child: Container(padding: const EdgeInsets.all(6), decoration: BoxDecoration(color: ZamzaColors.primary, borderRadius: BorderRadius.circular(8)), child: const Icon(Icons.add, color: Colors.white, size: 18)),
                  )
                else
                  Row(children: [
                    GestureDetector(onTap: () => _removeFromCart(p), child: const Icon(Icons.remove_circle, color: ZamzaColors.primary, size: 20)),
                    Padding(padding: const EdgeInsets.symmetric(horizontal: 8), child: Text('${_cart[p.name]}', style: const TextStyle(fontWeight: FontWeight.w600))),
                    GestureDetector(onTap: () => _addToCart(p), child: const Icon(Icons.add_circle, color: ZamzaColors.primary, size: 20)),
                  ]),
              ]),
            ]),
          ),
        ],
      ),
    ),
  );
}


  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          CustomScrollView(
            controller: _scrollController,
            slivers: [
              SliverAppBar(
                expandedHeight: 0, floating: true, backgroundColor: ZamzaColors.background,
                title: Row(children: [
                  const Icon(Icons.location_on, size: 18, color: ZamzaColors.primary),
                  const SizedBox(width: 4),
                  Text(_selectedAddress?.label ?? 'Home', style: ZamzaText.body.copyWith(fontWeight: FontWeight.w600)),
                  const Icon(Icons.keyboard_arrow_down, size: 18),
                ]),
                actions: [
                  Container(
                    margin: const EdgeInsets.only(right: 8), padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(gradient: const LinearGradient(colors: [ZamzaColors.primary, ZamzaColors.secondary]), borderRadius: BorderRadius.circular(20)),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      const Icon(Icons.account_balance_wallet, size: 16, color: Colors.white),
                      const SizedBox(width: 4),
                      Text('₹250', style: ZamzaText.caption.copyWith(color: Colors.white)),
                    ]),
                  ),
                  IconButton(icon: const Icon(Icons.notifications_outlined, color: ZamzaColors.accent), onPressed: () {}),
                  IconButton(icon: const Icon(Icons.shopping_bag_outlined, color: ZamzaColors.accent), onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => CartPage(cart: _cart, products: _products, onRemove: _removeFromCart, onAdd: _addToCart, onPlaceOrder: _placeOrder)))),
                ],
              ),
              if (_banners.isNotEmpty)
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: 180,
                    child: PageView.builder(
                      itemCount: _banners.length,
                      itemBuilder: (_, i) => Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(ZamzaRadius.lg),
                          child: Container(
                            decoration: BoxDecoration(gradient: const LinearGradient(colors: [ZamzaColors.primary, ZamzaColors.secondary]), borderRadius: BorderRadius.circular(ZamzaRadius.lg)),
                            child: Stack(children: [
                              Positioned(left: 20, top: 30, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Text(_banners[i]['title'] ?? 'Special Offer', style: ZamzaText.heading2.copyWith(color: Colors.white)),
                                const SizedBox(height: 8),
                                Text('Grab it now!', style: ZamzaText.body.copyWith(color: Colors.white70)),
                                const SizedBox(height: 12),
                                ElevatedButton(onPressed: () {}, style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: ZamzaColors.primary, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))), child: const Text('Shop Now')),
                              ])),
                            ]),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              if (_featuredProducts.isNotEmpty)
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                        Text('Featured Products', style: ZamzaText.heading3),
                        TextButton(onPressed: () {}, child: Text('See All', style: ZamzaText.body.copyWith(color: ZamzaColors.primary))),
                      ]),
                      const SizedBox(height: 12),
                      SizedBox(height: 200, child: ListView.separated(scrollDirection: Axis.horizontal, itemCount: _featuredProducts.length, separatorBuilder: (_, __) => const SizedBox(width: 12), itemBuilder: (_, i) => _buildFeaturedCard(_featuredProducts[i]))),
                    ]),
                  ),
                ),
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Categories', style: ZamzaText.heading3),
                    const SizedBox(height: 12),
                    SizedBox(height: 80, child: ListView.separated(scrollDirection: Axis.horizontal, itemCount: _categories.length, separatorBuilder: (_, __) => const SizedBox(width: 12), itemBuilder: (_, i) => _buildCategoryChip(_categories[i]))),
                  ]),
                ),
              ),
              if (_loading)
                SliverToBoxAdapter(child: _shimmerGrid())
              else
                SliverPadding(
                  padding: const EdgeInsets.all(16),
                  sliver: SliverGrid(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, childAspectRatio: 0.72, crossAxisSpacing: 12, mainAxisSpacing: 12),
                    delegate: SliverChildBuilderDelegate((_, index) => _buildProductCard(_filtered[index]), childCount: _filtered.length),
                  ),
                ),
              const SliverToBoxAdapter(child: SizedBox(height: 80)),
            ],
          ),
          if (_showFloatingSearch)
            Positioned(
              top: MediaQuery.of(context).padding.top + 8, left: 16, right: 16,
              child: Material(
                elevation: 8, borderRadius: BorderRadius.circular(ZamzaRadius.lg),
                child: TextField(
                  controller: _searchCtrl, onChanged: (_) => _filter(),
                  decoration: InputDecoration(
                    hintText: 'Search for products...', hintStyle: ZamzaText.body.copyWith(color: ZamzaColors.grey500),
                    prefixIcon: const Icon(Icons.search, color: ZamzaColors.primary),
                    suffixIcon: IconButton(icon: const Icon(Icons.mic, color: ZamzaColors.primary), onPressed: () {}),
                    filled: true, fillColor: ZamzaColors.card,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(ZamzaRadius.lg), borderSide: BorderSide.none),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _shimmerGrid() => GridView.builder(
    padding: const EdgeInsets.all(16), gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, childAspectRatio: 0.72, crossAxisSpacing: 12, mainAxisSpacing: 12),
    itemCount: 6, itemBuilder: (_, __) => Shimmer.fromColors(baseColor: Colors.grey.shade200, highlightColor: Colors.grey.shade100, child: Container(decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)))),
  );
}

class CartPage extends StatefulWidget {
  final Map<String, int> cart;
  final List<Product> products;
  final Function(Product) onRemove;
  final Function(Product) onAdd;
  final VoidCallback onPlaceOrder;

  const CartPage({
    super.key,
    required this.cart,
    required this.products,
    required this.onRemove,
    required this.onAdd,
    required this.onPlaceOrder,
  });

  @override
  State<CartPage> createState() => _CartPageState();
}

class _CartPageState extends State<CartPage> {
  final TextEditingController _couponCtrl = TextEditingController();
  String? _appliedCoupon;
  double _discount = 0;

  @override
  Widget build(BuildContext context) {
    final items = widget.products
        .where((p) => widget.cart.containsKey(p.name))
        .toList();
    final subtotal =
        items.fold<double>(0, (s, p) => s + (p.price * widget.cart[p.name]!));
    final deliveryFee = subtotal > 499 ? 0.0 : 29.0;
    final savings = items.isNotEmpty ? (subtotal * 0.1) : 0.0; // dummy saving
    final total = subtotal + deliveryFee - _discount;

    return Scaffold(
      backgroundColor: ZamzaColors.background,
      appBar: AppBar(
        title: Text('Your Cart', style: ZamzaText.heading3.copyWith(color: ZamzaColors.accent)),
      ),
      body: items.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.shopping_cart_outlined,
                      size: 80, color: ZamzaColors.grey500),
                  const SizedBox(height: 16),
                  Text('Your cart is empty',
                      style: ZamzaText.body.copyWith(color: ZamzaColors.grey500)),
                ],
              ),
            )
          : Column(
              children: [
                // Cart Items
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: items.length,
                    itemBuilder: (_, i) {
                      final p = items[i];
                      final qty = widget.cart[p.name]!;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: ZamzaColors.card,
                          borderRadius: BorderRadius.circular(ZamzaRadius.md),
                          boxShadow: const [ZamzaShadows.card],
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(ZamzaRadius.sm),
                                child: Image.network(
                                  p.imageUrl ?? 'https://via.placeholder.com/80',
                                  width: 70,
                                  height: 70,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => Container(
                                    width: 70, height: 70,
                                    color: ZamzaColors.grey200,
                                    child: const Icon(Icons.image, color: ZamzaColors.grey500),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(p.name, style: ZamzaText.body.copyWith(fontWeight: FontWeight.w600)),
                                    const SizedBox(height: 4),
                                    Text('₹${p.price.toStringAsFixed(0)}',
                                        style: ZamzaText.price),
                                  ],
                                ),
                              ),
                              // Quantity buttons
                              Container(
                                decoration: BoxDecoration(
                                  color: ZamzaColors.grey100,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Row(
                                  children: [
                                    GestureDetector(
                                      onTap: () => widget.onRemove(p),
                                      child: const Padding(
                                        padding: EdgeInsets.all(8),
                                        child: Icon(Icons.remove, color: ZamzaColors.primary, size: 20),
                                      ),
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 12),
                                      child: Text('$qty', style: const TextStyle(fontWeight: FontWeight.w600)),
                                    ),
                                    GestureDetector(
                                      onTap: () => widget.onAdd(p),
                                      child: const Padding(
                                        padding: EdgeInsets.all(8),
                                        child: Icon(Icons.add, color: ZamzaColors.primary, size: 20),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
                // Coupon, Summary, Checkout
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: ZamzaColors.card,
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(ZamzaRadius.xl)),
                    boxShadow: const [ZamzaShadows.card],
                  ),
                  child: Column(
                    children: [
                      // Coupon input
                      Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _couponCtrl,
                              decoration: InputDecoration(
                                hintText: 'Enter coupon code',
                                hintStyle: ZamzaText.caption,
                                prefixIcon: const Icon(Icons.discount, color: ZamzaColors.primary),
                                filled: true,
                                fillColor: ZamzaColors.grey100,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(ZamzaRadius.sm),
                                  borderSide: BorderSide.none,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          ElevatedButton(
                            onPressed: () {
                              setState(() {
                                _appliedCoupon = _couponCtrl.text.trim();
                                _discount = subtotal * 0.2; // dummy 20% off
                              });
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text(_appliedCoupon!.isEmpty ? 'Enter a code' : 'Coupon applied!')),
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: ZamzaColors.primary,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(ZamzaRadius.sm),
                              ),
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            ),
                            child: const Text('Apply'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      // Price breakdown
                      _summaryRow('Subtotal', '₹${subtotal.toStringAsFixed(0)}'),
                      _summaryRow('Delivery', deliveryFee == 0 ? 'FREE' : '₹$deliveryFee'),
                      _summaryRow('Savings', '-₹${savings.toStringAsFixed(0)}'),
                      if (_appliedCoupon != null)
                        _summaryRow('Coupon (${_appliedCoupon!})', '-₹${_discount.toStringAsFixed(0)}'),
                      const Divider(height: 24),
                      _summaryRow('Total', '₹${total.toStringAsFixed(0)}', isTotal: true),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: widget.onPlaceOrder,
                          icon: const Icon(Icons.lock),
                          label: const Text('Place Order'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: ZamzaColors.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(ZamzaRadius.md),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  Widget _summaryRow(String label, String value, {bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: isTotal ? ZamzaText.heading3 : ZamzaText.body),
          Text(value,
              style: isTotal
                  ? ZamzaText.heading3.copyWith(color: ZamzaColors.primary)
                  : ZamzaText.body.copyWith(fontWeight: FontWeight.w600)),
        ],
      ),
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
  void initState() { super.initState(); _fetchOrders(); _connectSocket(); }

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
    await http.put(Uri.parse('$apiBaseUrl/api/admin/orders/$orderId/status'), headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'}, body: json.encode({'status': 'cancelled'}));
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
            const SizedBox(height: 8), Text('Total: ₹${o['total_amount']}'), const SizedBox(height: 8),
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
  void initState() { super.initState(); _loadFavorites(); }

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
