import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

const String apiBaseUrl = 'http://localhost:3000'; // your PC IP

void main() => runApp(const AdminApp());

class AdminApp extends StatelessWidget {
  const AdminApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'QuickCart Admin',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: Colors.deepPurple,
        brightness: Brightness.light,
        textTheme: GoogleFonts.poppinsTextTheme(),
        appBarTheme: const AppBarTheme(elevation: 0, backgroundColor: Colors.deepPurple, foregroundColor: Colors.white),
        cardTheme: CardTheme(elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)), color: Colors.white),
      ),
      home: const SplashScreen(),
    );
  }
}

// ========== SPLASH ==========
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
      if (mounted) Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => token != null && token!.isNotEmpty ? const AdminHome() : const LoginScreen()));
    });
  }
  @override
  Widget build(BuildContext context) => Scaffold(backgroundColor: Colors.deepPurple, body: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [const Icon(Icons.admin_panel_settings, size: 80, color: Colors.white), const SizedBox(height: 24), Text('Admin Panel', style: GoogleFonts.poppins(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white))])));
}

// ========== LOGIN ==========
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
    if (phone.length < 10) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter valid phone'))); return; }
    setState(() => _loading = true);
    try {
      final res = await http.post(Uri.parse('$apiBaseUrl/api/auth/send-otp'), headers: {'Content-Type': 'application/json'}, body: json.encode({'phone': phone, 'role': 'admin'}));
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
      backgroundColor: Colors.deepPurple,
      body: SafeArea(child: Center(child: SingleChildScrollView(padding: const EdgeInsets.all(32), child: Column(children: [
        const Icon(Icons.admin_panel_settings, size: 80, color: Colors.white),
        const SizedBox(height: 24),
        Text('Admin Login', style: GoogleFonts.poppins(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
        const SizedBox(height: 40),
        TextField(controller: _phoneCtrl, keyboardType: TextInputType.phone, maxLength: 10, style: const TextStyle(color: Colors.white, fontSize: 18), decoration: InputDecoration(labelText: 'Phone Number', labelStyle: const TextStyle(color: Colors.white70), prefixText: '+91 ', prefixStyle: const TextStyle(color: Colors.white, fontSize: 18), enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Colors.white30)), focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Colors.white)))),
        const SizedBox(height: 32),
        SizedBox(width: double.infinity, height: 56, child: ElevatedButton(onPressed: _loading ? null : _sendOtp, style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: Colors.deepPurple), child: _loading ? const CircularProgressIndicator() : Text('Send OTP', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600)))),
      ])))),
    );
  }
}

// ========== OTP ==========
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
        if (mounted) Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const AdminHome()), (route) => false);
      }
    } catch (e) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'))); }
    setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(backgroundColor: Colors.deepPurple, body: SafeArea(child: Padding(padding: const EdgeInsets.all(32), child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      Text('Enter OTP', style: GoogleFonts.poppins(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
      const SizedBox(height: 8),
      Text('Sent to ${widget.phone} (Dev: ${widget.otp})', style: const TextStyle(color: Colors.white70)),
      const SizedBox(height: 40),
      TextField(controller: _otpCtrl, keyboardType: TextInputType.number, maxLength: 6, style: const TextStyle(color: Colors.white, fontSize: 24, letterSpacing: 8), textAlign: TextAlign.center, decoration: InputDecoration(enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Colors.white30)), focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Colors.white)))),
      const SizedBox(height: 32),
      SizedBox(width: double.infinity, height: 56, child: ElevatedButton(onPressed: _loading ? null : _verifyOtp, style: ElevatedButton.styleFrom(backgroundColor: Colors.white, foregroundColor: Colors.deepPurple), child: _loading ? const CircularProgressIndicator() : Text('Verify OTP', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600)))),
    ]))));
  }
}

// ========== ADMIN HOME ==========
class AdminHome extends StatefulWidget {
  const AdminHome({super.key});
  @override
  State<AdminHome> createState() => _AdminHomeState();
}
class _AdminHomeState extends State<AdminHome> {
  int _currentIndex = 0;
  final _pages = const [
    DashboardTab(),
    ProductsTab(),
    OrdersTab(),
    RidersTab(),
    BannersTab(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Admin Panel'), actions: [
        IconButton(icon: const Icon(Icons.logout), onPressed: () async { final prefs = await SharedPreferences.getInstance(); await prefs.clear(); if (mounted) Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const LoginScreen()), (route) => false); }),
      ]),
      body: _pages[_currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (i) => setState(() => _currentIndex = i),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard), label: 'Dashboard'),
          NavigationDestination(icon: Icon(Icons.inventory), label: 'Products'),
          NavigationDestination(icon: Icon(Icons.shopping_bag), label: 'Orders'),
          NavigationDestination(icon: Icon(Icons.delivery_dining), label: 'Riders'),
          NavigationDestination(icon: Icon(Icons.photo_library), label: 'Banners'),
        ],
      ),
    );
  }
}

// ========== DASHBOARD TAB ==========
class DashboardTab extends StatefulWidget {
  const DashboardTab({super.key});
  @override
  State<DashboardTab> createState() => _DashboardTabState();
}
class _DashboardTabState extends State<DashboardTab> {
  Map<String, dynamic>? _stats;
  bool _loading = true;

  Future<String> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token') ?? '';
  }

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  Future<void> _fetchStats() async {
    final token = await _getToken();
    try {
      final res = await http.get(Uri.parse('$apiBaseUrl/api/admin/stats'), headers: {'Authorization': 'Bearer $token'});
      if (res.statusCode == 200) setState(() { _stats = json.decode(res.body); _loading = false; });
    } catch (e) { setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_stats == null) return const Center(child: Text('Failed to load'));
    return RefreshIndicator(onRefresh: _fetchStats, child: ListView(padding: const EdgeInsets.all(16), children: [
      _statCard('Total Orders', _stats!['totalOrders'], Colors.blue),
      _statCard('Total Revenue', '₹${_stats!['totalRevenue']}', Colors.green),
      _statCard('Total Users', _stats!['totalUsers'], Colors.orange),
      _statCard('Total Riders', _stats!['totalRiders'], Colors.purple),
      _statCard('Total Products', _stats!['totalProducts'], Colors.teal),
    ]));
  }

  Widget _statCard(String label, dynamic value, Color color) => Card(margin: const EdgeInsets.only(bottom: 12), child: ListTile(leading: CircleAvatar(backgroundColor: color.withOpacity(0.1), child: Icon(Icons.analytics, color: color)), title: Text(label, style: GoogleFonts.poppins(fontSize: 16)), trailing: Text('$value', style: GoogleFonts.poppins(fontSize: 22, fontWeight: FontWeight.bold, color: color))));
}

// ========== PRODUCTS TAB (with Featured + Deal Toggles) ==========
class ProductsTab extends StatefulWidget {
  const ProductsTab({super.key});
  @override
  State<ProductsTab> createState() => _ProductsTabState();
}

class _ProductsTabState extends State<ProductsTab> {
  List<dynamic> _products = [];
  bool _loading = true;

  Future<String> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token') ?? '';
  }

  @override
  void initState() {
    super.initState();
    _fetchProducts();
  }

  Future<void> _fetchProducts() async {
    final token = await _getToken();
    try {
      final res = await http.get(
        Uri.parse('$apiBaseUrl/api/admin/products'),
        headers: {'Authorization': 'Bearer $token'},
      );
      if (res.statusCode == 200) {
        setState(() {
          _products = json.decode(res.body);
          _loading = false;
        });
      }
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _toggleFeatured(int id, bool currentValue) async {
    final token = await _getToken();
    await http.put(
      Uri.parse('$apiBaseUrl/api/admin/products/$id'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode({'is_featured': !currentValue}),
    );
    _fetchProducts();
  }

  Future<void> _toggleDeal(int id, bool currentValue, dynamic product) async {
    final token = await _getToken();
    // Default deal: 20% off, expires in 24 hours
    final dealPrice = (double.parse(product['price'].toString()) * 0.8).toStringAsFixed(2);
    final dealExpiry = DateTime.now().add(const Duration(hours: 24)).toIso8601String();
    await http.put(
      Uri.parse('$apiBaseUrl/api/admin/products/$id'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: json.encode({
        'is_deal': !currentValue,
        'deal_price': double.parse(dealPrice),
        'deal_expiry': dealExpiry,
      }),
    );
    _fetchProducts();
  }

  Future<void> _addProduct() async {
    final nameCtrl = TextEditingController();
    final priceCtrl = TextEditingController();
    final catCtrl = TextEditingController();
    final stockCtrl = TextEditingController();

    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add Product'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Name')),
            TextField(controller: catCtrl, decoration: const InputDecoration(labelText: 'Category')),
            TextField(controller: priceCtrl, decoration: const InputDecoration(labelText: 'Price'), keyboardType: TextInputType.number),
            TextField(controller: stockCtrl, decoration: const InputDecoration(labelText: 'Stock'), keyboardType: TextInputType.number),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Add')),
        ],
      ),
    );

    if (result == true) {
      final token = await _getToken();
      await http.post(
        Uri.parse('$apiBaseUrl/api/admin/products'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'name': nameCtrl.text,
          'category': catCtrl.text,
          'price': double.parse(priceCtrl.text),
          'stock_quantity': int.parse(stockCtrl.text),
        }),
      );
      _fetchProducts();
    }
  }

  Future<void> _deleteProduct(int id) async {
    final token = await _getToken();
    await http.delete(
      Uri.parse('$apiBaseUrl/api/admin/products/$id'),
      headers: {'Authorization': 'Bearer $token'},
    );
    _fetchProducts();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: _addProduct,
        child: const Icon(Icons.add),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _products.length,
              itemBuilder: (_, i) {
                final p = _products[i];
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    title: Text(p['name']),
                    subtitle: Text('₹${p['price']} - Stock: ${p['stock_quantity']}'),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        // Featured toggle
                        Switch(
                          value: p['is_featured'] == true,
                          onChanged: (_) => _toggleFeatured(p['id'], p['is_featured'] == true),
                          activeColor: Colors.orange,
                        ),
                        // Deal toggle
                        Switch(
                          value: p['is_deal'] == true,
                          onChanged: (_) => _toggleDeal(p['id'], p['is_deal'] == true, p),
                          activeColor: Colors.red,
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete, color: Colors.red),
                          onPressed: () => _deleteProduct(p['id']),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}

// ========== ORDERS TAB ==========
class OrdersTab extends StatefulWidget {
  const OrdersTab({super.key});
  @override
  State<OrdersTab> createState() => _OrdersTabState();
}
class _OrdersTabState extends State<OrdersTab> {
  List<dynamic> _orders = [];
  bool _loading = true;
  String? _statusFilter;

  Future<String> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token') ?? '';
  }

  @override
  void initState() { super.initState(); _fetchOrders(); }

  Future<void> _fetchOrders() async {
    final token = await _getToken();
    String url = '$apiBaseUrl/api/admin/orders';
    if (_statusFilter != null) url += '?status=$_statusFilter';
    try {
      final res = await http.get(Uri.parse(url), headers: {'Authorization': 'Bearer $token'});
      if (res.statusCode == 200) setState(() { _orders = json.decode(res.body); _loading = false; });
    } catch (e) { setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) => Column(children: [
    SingleChildScrollView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.all(8), child: Row(children: ['placed', 'packed', 'assigned', 'picked_up', 'delivered'].map((s) => Padding(padding: const EdgeInsets.symmetric(horizontal: 4), child: FilterChip(label: Text(s), selected: _statusFilter == s, onSelected: (v) { setState(() => _statusFilter = v ? s : null); _fetchOrders(); }))).toList())),
    Expanded(child: _loading ? const Center(child: CircularProgressIndicator()) : ListView.builder(padding: const EdgeInsets.all(16), itemCount: _orders.length, itemBuilder: (_, i) {
      final o = _orders[i];
      return Card(margin: const EdgeInsets.only(bottom: 8), child: ListTile(title: Text('Order #${o['id']} - ₹${o['total_amount']}'), subtitle: Text('Status: ${o['status']}\nCustomer: ${o['customer_phone'] ?? 'N/A'}'), trailing: Text('#${o['id']}', style: const TextStyle(fontWeight: FontWeight.bold))));
    })),
  ]);
}

// ========== RIDERS TAB ==========
class RidersTab extends StatefulWidget {
  const RidersTab({super.key});
  @override
  State<RidersTab> createState() => _RidersTabState();
}
class _RidersTabState extends State<RidersTab> {
  List<dynamic> _riders = [];
  bool _loading = true;

  Future<String> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token') ?? '';
  }

  @override
  void initState() { super.initState(); _fetchRiders(); }

  Future<void> _fetchRiders() async {
    final token = await _getToken();
    try {
      final res = await http.get(Uri.parse('$apiBaseUrl/api/admin/riders'), headers: {'Authorization': 'Bearer $token'});
      if (res.statusCode == 200) setState(() { _riders = json.decode(res.body); _loading = false; });
    } catch (e) { setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) => _loading ? const Center(child: CircularProgressIndicator()) : ListView.builder(padding: const EdgeInsets.all(16), itemCount: _riders.length, itemBuilder: (_, i) {
    final r = _riders[i];
    return Card(margin: const EdgeInsets.only(bottom: 8), child: ListTile(leading: const CircleAvatar(child: Icon(Icons.person)), title: Text(r['phone'] ?? 'N/A'), subtitle: Text('Vehicle: ${r['vehicle_number'] ?? 'N/A'}'), trailing: const Icon(Icons.delivery_dining, color: Colors.green)));
  });
}

// ========== BANNERS TAB ==========
class BannersTab extends StatefulWidget {
  const BannersTab({super.key});
  @override
  State<BannersTab> createState() => _BannersTabState();
}
class _BannersTabState extends State<BannersTab> {
  List<dynamic> _banners = [];
  bool _loading = true;

  Future<String> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token') ?? '';
  }

  @override
  void initState() { super.initState(); _fetchBanners(); }

  Future<void> _fetchBanners() async {
    final token = await _getToken();
    try {
      final res = await http.get(Uri.parse('$apiBaseUrl/api/admin/banners'), headers: {'Authorization': 'Bearer $token'});
      if (res.statusCode == 200) setState(() { _banners = json.decode(res.body); _loading = false; });
    } catch (e) { setState(() => _loading = false); }
  }

  Future<void> _addBanner() async {
    final urlCtrl = TextEditingController(), titleCtrl = TextEditingController(), linkCtrl = TextEditingController();
    final result = await showDialog<bool>(context: context, builder: (ctx) => AlertDialog(title: const Text('Add Banner'), content: Column(mainAxisSize: MainAxisSize.min, children: [
      TextField(controller: urlCtrl, decoration: const InputDecoration(labelText: 'Image URL')),
      TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'Title (optional)')),
      TextField(controller: linkCtrl, decoration: const InputDecoration(labelText: 'Link (optional)')),
    ]), actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')), ElevatedButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Add'))]));
    if (result == true) {
      final token = await _getToken();
      await http.post(Uri.parse('$apiBaseUrl/api/admin/banners'), headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'}, body: json.encode({'image_url': urlCtrl.text, 'title': titleCtrl.text, 'link_url': linkCtrl.text}));
      _fetchBanners();
    }
  }

  Future<void> _deleteBanner(int id) async {
    final token = await _getToken();
    await http.delete(Uri.parse('$apiBaseUrl/api/admin/banners/$id'), headers: {'Authorization': 'Bearer $token'});
    _fetchBanners();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    floatingActionButton: FloatingActionButton(onPressed: _addBanner, child: const Icon(Icons.add)),
    body: _loading ? const Center(child: CircularProgressIndicator()) : ListView.builder(padding: const EdgeInsets.all(16), itemCount: _banners.length, itemBuilder: (_, i) {
      final b = _banners[i];
      return Card(
        margin: const EdgeInsets.only(bottom: 8),
        child: ListTile(
          leading: ClipRRect(borderRadius: BorderRadius.circular(8), child: Image.network(b['image_url'], width: 60, height: 40, fit: BoxFit.cover, errorBuilder: (_, __, ___) => const Icon(Icons.broken_image))),
          title: Text(b['title'] ?? 'Banner #${b['id']}'),
          subtitle: Text(b['link_url'] ?? ''),
          trailing: IconButton(icon: const Icon(Icons.delete, color: Colors.red), onPressed: () => _deleteBanner(b['id'])),
        ),
      );
    }),
  );
}