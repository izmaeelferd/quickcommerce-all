import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:store_app/core/theme/app_theme.dart'; // adjust package name if needed

const String apiBaseUrl = 'http://192.168.0.65:3000'; // your PC IP

void main() => runApp(const StoreApp());

class StoreApp extends StatelessWidget {
  const StoreApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ZAMZA Store',
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
      home: const SplashScreen(),
    );
  }
}

// ============ SPLASH ============
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
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => token != null && token!.isNotEmpty ? const StoreHome() : const LoginScreen()),
        );
      }
    });
  }
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(colors: [ZamzaColors.primary, ZamzaColors.secondary]),
        ),
        child: Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          const Icon(Icons.store, size: 80, color: Colors.white),
          const SizedBox(height: 24),
          Text('ZAMZA Store', style: GoogleFonts.poppins(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
        ])),
      ),
    );
  }
}

// ============ LOGIN ============
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
      final res = await http.post(Uri.parse('$apiBaseUrl/api/auth/send-otp'), headers: {'Content-Type': 'application/json'}, body: json.encode({'phone': phone, 'role': 'store_operator'}));
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
        const Icon(Icons.store, size: 80, color: ZamzaColors.primary),
        const SizedBox(height: 24),
        Text('Store Login', style: GoogleFonts.poppins(fontSize: 28, fontWeight: FontWeight.bold, color: ZamzaColors.accent)),
        const SizedBox(height: 40),
        TextField(controller: _phoneCtrl, keyboardType: TextInputType.phone, maxLength: 10, style: const TextStyle(fontSize: 18), decoration: InputDecoration(labelText: 'Phone Number', labelStyle: TextStyle(color: ZamzaColors.grey500), prefixText: '+91 ', prefixStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600), enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: ZamzaColors.grey200)), focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: ZamzaColors.primary)))),
        const SizedBox(height: 32),
        SizedBox(width: double.infinity, height: 56, child: ElevatedButton(onPressed: _loading ? null : _sendOtp, child: _loading ? const CircularProgressIndicator() : Text('Send OTP', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600)))),
      ])))),
    );
  }
}

// ============ OTP ============
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
        if (mounted) Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const StoreHome()), (route) => false);
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
        TextField(controller: _otpCtrl, keyboardType: TextInputType.number, maxLength: 6, style: const TextStyle(fontSize: 24, letterSpacing: 8), textAlign: TextAlign.center, decoration: InputDecoration(enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: ZamzaColors.grey200)), focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: ZamzaColors.primary)))),
        const SizedBox(height: 32),
        SizedBox(width: double.infinity, height: 56, child: ElevatedButton(onPressed: _loading ? null : _verifyOtp, child: _loading ? const CircularProgressIndicator() : Text('Verify OTP', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.w600)))),
      ]))),
    );
  }
}

// ============ STORE HOME (Tabbed) ============
class StoreHome extends StatefulWidget {
  const StoreHome({super.key});
  @override
  State<StoreHome> createState() => _StoreHomeState();
}
class _StoreHomeState extends State<StoreHome> {
  List<dynamic> _newOrders = [], _packedHistory = [];
  bool _loading = true;

  Future<String> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token') ?? '';
  }

  @override
  void initState() { super.initState(); _fetchOrders(); }

  Future<void> _fetchOrders() async {
    final token = await _getToken();
    if (token.isEmpty) return;
    try {
      final res = await http.get(Uri.parse('$apiBaseUrl/api/store/orders/new'), headers: {'Authorization': 'Bearer $token'});
      if (res.statusCode == 200) {
        final orders = json.decode(res.body) as List;
        setState(() {
          _newOrders = orders.where((o) => o['status'] == 'placed').toList();
          _packedHistory = orders.where((o) => o['status'] == 'packed').toList();
          _loading = false;
        });
      } else { setState(() => _loading = false); }
    } catch (e) { setState(() => _loading = false); }
  }

  Future<void> _packOrder(int orderId) async {
    final token = await _getToken();
    try {
      final res = await http.put(Uri.parse('$apiBaseUrl/api/store/orders/$orderId/pack'), headers: {'Authorization': 'Bearer $token'});
      if (res.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Order packed!')));
        _fetchOrders();
      }
    } catch (e) { ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'))); }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Store Dashboard', style: ZamzaText.heading3),
        actions: [
          IconButton(icon: const Icon(Icons.logout), onPressed: () async {
            final prefs = await SharedPreferences.getInstance();
            await prefs.clear();
            if (mounted) Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const LoginScreen()), (route) => false);
          }),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : DefaultTabController(
              length: 2,
              child: Column(children: [
                TabBar(
                  labelColor: ZamzaColors.primary,
                  unselectedLabelColor: ZamzaColors.grey500,
                  indicatorColor: ZamzaColors.primary,
                  tabs: const [Tab(text: 'New Orders'), Tab(text: 'Packed History')],
                ),
                Expanded(
                  child: TabBarView(children: [
                    // New Orders
                    RefreshIndicator(
                      onRefresh: _fetchOrders,
                      child: _newOrders.isEmpty
                          ? ListView(children: [Padding(padding: const EdgeInsets.all(32), child: Center(child: Text('No new orders', style: TextStyle(color: ZamzaColors.grey500))))])
                          : ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: _newOrders.length,
                              itemBuilder: (_, i) {
                                final o = _newOrders[i];
                                final items = o['items'] as List<dynamic>? ?? [];
                                return Card(
                                  margin: const EdgeInsets.only(bottom: 16),
                                  child: Padding(
                                    padding: const EdgeInsets.all(16),
                                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                                        Text('Order #${o['id']}', style: ZamzaText.heading3),
                                        Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4), decoration: BoxDecoration(color: ZamzaColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(20)), child: Text('New', style: TextStyle(color: ZamzaColors.primary, fontSize: 12, fontWeight: FontWeight.w500))),
                                      ]),
                                      const SizedBox(height: 8),
                                      Text('Total: ₹${o['total_amount']}', style: ZamzaText.price),
                                      Text('Address: ${o['delivery_address']}', style: TextStyle(color: ZamzaColors.grey500)),
                                      const Divider(height: 24),
                                      ...items.map((item) => CheckboxListTile(dense: true, title: Text(item['name']), subtitle: Text('Qty: ${item['quantity']}'), value: true, onChanged: (_) {}, activeColor: ZamzaColors.primary)),
                                      const SizedBox(height: 16),
                                      SizedBox(width: double.infinity, child: ElevatedButton.icon(onPressed: () => _packOrder(o['id']), icon: const Icon(Icons.check), label: const Text('Pack Order'), style: ElevatedButton.styleFrom(backgroundColor: ZamzaColors.success, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 16)))),
                                    ]),
                                  ),
                                );
                              },
                            ),
                    ),
                    // Packed History
                    RefreshIndicator(
                      onRefresh: _fetchOrders,
                      child: _packedHistory.isEmpty
                          ? ListView(children: [Padding(padding: const EdgeInsets.all(32), child: Center(child: Text('No packed orders yet', style: TextStyle(color: ZamzaColors.grey500))))])
                          : ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: _packedHistory.length,
                              itemBuilder: (_, i) {
                                final o = _packedHistory[i];
                                return Card(
                                  margin: const EdgeInsets.only(bottom: 8),
                                  child: ListTile(
                                    title: Text('Order #${o['id']} - ₹${o['total_amount']}'),
                                    subtitle: Text('Status: ${o['status']}'),
                                    trailing: const Icon(Icons.check_circle, color: ZamzaColors.success),
                                  ),
                                );
                              },
                            ),
                    ),
                  ]),
                ),
              ]),
            ),
    );
  }
}