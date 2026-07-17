import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:rider_app/core/theme/app_theme.dart'; // adjust package name if needed

const String apiBaseUrl = 'http://192.168.0.65:3000'; // your PC IP

void main() => runApp(const RiderApp());

class RiderApp extends StatelessWidget {
  const RiderApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ZAMZA Rider',
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
          MaterialPageRoute(builder: (_) => token != null && token!.isNotEmpty ? const RiderHome() : const LoginScreen()),
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
          const Icon(Icons.delivery_dining, size: 80, color: Colors.white),
          const SizedBox(height: 24),
          Text('ZAMZA Rider', style: GoogleFonts.poppins(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
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
      final res = await http.post(Uri.parse('$apiBaseUrl/api/auth/send-otp'), headers: {'Content-Type': 'application/json'}, body: json.encode({'phone': phone, 'role': 'rider'}));
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
        const Icon(Icons.delivery_dining, size: 80, color: ZamzaColors.primary),
        const SizedBox(height: 24),
        Text('Rider Login', style: GoogleFonts.poppins(fontSize: 28, fontWeight: FontWeight.bold, color: ZamzaColors.accent)),
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
        if (mounted) Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const RiderHome()), (route) => false);
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

// ============ RIDER HOME (Tabs + Earnings Stats) ============
class RiderHome extends StatefulWidget {
  const RiderHome({super.key});
  @override
  State<RiderHome> createState() => _RiderHomeState();
}
class _RiderHomeState extends State<RiderHome> {
  List<dynamic> _newOrders = [], _myOrders = [], _deliveryHistory = [];
  bool _loading = true, _isOnline = true;
  int _totalDeliveries = 0;
  double _totalEarnings = 0;
  IO.Socket? _socket;

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
    _socket!.on('newOrderAvailable', (_) { if (mounted) _fetchOrders(); });
  }

  @override
  void dispose() { _socket?.disconnect(); super.dispose(); }

  Future<void> _fetchOrders() async {
    final token = await _getToken();
    if (token.isEmpty) return;
    try {
      final newRes = await http.get(Uri.parse('$apiBaseUrl/api/rider/orders/new'), headers: {'Authorization': 'Bearer $token'});
      final myRes = await http.get(Uri.parse('$apiBaseUrl/api/rider/orders/my'), headers: {'Authorization': 'Bearer $token'});
      if (newRes.statusCode == 200 && myRes.statusCode == 200) {
        final myOrders = json.decode(myRes.body) as List;
        int deliveries = 0;
        double earnings = 0;
        List<dynamic> history = [];
        for (var o in myOrders) {
          if (o['status'] == 'delivered') {
            deliveries++;
            earnings += double.parse(o['total_amount'].toString());
            history.add(o);
          }
        }
        setState(() {
          _newOrders = json.decode(newRes.body);
          _myOrders = myOrders;
          _totalDeliveries = deliveries;
          _totalEarnings = earnings;
          _deliveryHistory = history;
          _loading = false;
        });
      } else {
        setState(() => _loading = false);
      }
    } catch (e) { setState(() => _loading = false); }
  }

  Future<void> _acceptOrder(int id) async {
    final token = await _getToken();
    await http.put(Uri.parse('$apiBaseUrl/api/rider/orders/$id/accept'), headers: {'Authorization': 'Bearer $token'});
    _fetchOrders();
  }

  Future<void> _updateStatus(int id, String status) async {
    final token = await _getToken();
    await http.put(Uri.parse('$apiBaseUrl/api/rider/orders/$id/status'), headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'}, body: json.encode({'status': status}));
    _fetchOrders();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Rider Dashboard', style: ZamzaText.heading3),
        actions: [
          Switch(value: _isOnline, activeColor: ZamzaColors.success, onChanged: (v) => setState(() => _isOnline = v)),
          IconButton(icon: const Icon(Icons.logout), onPressed: () async {
            final prefs = await SharedPreferences.getInstance();
            await prefs.clear();
            if (mounted) Navigator.pushAndRemoveUntil(context, MaterialPageRoute(builder: (_) => const LoginScreen()), (route) => false);
          }),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Earnings & deliveries summary card
                Container(
                  margin: const EdgeInsets.all(16),
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [ZamzaColors.primary, ZamzaColors.secondary]),
                    borderRadius: BorderRadius.circular(ZamzaRadius.lg),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _statItem(Icons.check_circle, '$_totalDeliveries', 'Deliveries'),
                      _statItem(Icons.currency_rupee, '₹${_totalEarnings.toStringAsFixed(0)}', 'Earnings'),
                    ],
                  ),
                ),
                Expanded(
                  child: DefaultTabController(
                    length: 3,
                    child: Column(children: [
                      TabBar(
                        labelColor: ZamzaColors.primary,
                        unselectedLabelColor: ZamzaColors.grey500,
                        indicatorColor: ZamzaColors.primary,
                        tabs: const [Tab(text: 'New'), Tab(text: 'Active'), Tab(text: 'History')],
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
                                    itemBuilder: (_, i) => Card(
                                      child: ListTile(
                                        title: Text('Order #${_newOrders[i]['id']} - ₹${_newOrders[i]['total_amount']}'),
                                        subtitle: Text(_newOrders[i]['delivery_address'] ?? ''),
                                        trailing: ElevatedButton(
                                          onPressed: () => _acceptOrder(_newOrders[i]['id']),
                                          child: const Text('Accept'),
                                        ),
                                      ),
                                    ),
                                  ),
                          ),
                          // Active Orders
                          RefreshIndicator(
                            onRefresh: _fetchOrders,
                            child: _myOrders.isEmpty
                                ? ListView(children: [Padding(padding: const EdgeInsets.all(32), child: Center(child: Text('No active orders', style: TextStyle(color: ZamzaColors.grey500))))])
                                : ListView.builder(
                                    padding: const EdgeInsets.all(16),
                                    itemCount: _myOrders.length,
                                    itemBuilder: (_, i) {
                                      final o = _myOrders[i];
                                      return Card(
                                        child: Padding(
                                          padding: const EdgeInsets.all(12),
                                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                            Text('Order #${o['id']} - ₹${o['total_amount']}', style: ZamzaText.body.copyWith(fontWeight: FontWeight.bold)),
                                            const SizedBox(height: 4),
                                            Text('Status: ${o['status']}', style: ZamzaText.caption),
                                            Text('Address: ${o['delivery_address'] ?? ''}', style: ZamzaText.caption),
                                            const SizedBox(height: 8),
                                            Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: [
                                              if (o['status'] == 'assigned')
                                                ElevatedButton.icon(onPressed: () => _updateStatus(o['id'], 'picked_up'), icon: const Icon(Icons.shopping_bag), label: const Text('Picked Up')),
                                              if (o['status'] == 'picked_up')
                                                ElevatedButton.icon(onPressed: () => _updateStatus(o['id'], 'delivered'), icon: const Icon(Icons.check), label: const Text('Delivered'), style: ElevatedButton.styleFrom(backgroundColor: ZamzaColors.success)),
                                            ]),
                                          ]),
                                        ),
                                      );
                                    },
                                  ),
                          ),
                          // History
                          RefreshIndicator(
                            onRefresh: _fetchOrders,
                            child: _deliveryHistory.isEmpty
                                ? ListView(children: [Padding(padding: const EdgeInsets.all(32), child: Center(child: Text('No deliveries yet', style: TextStyle(color: ZamzaColors.grey500))))])
                                : ListView.builder(
                                    padding: const EdgeInsets.all(16),
                                    itemCount: _deliveryHistory.length,
                                    itemBuilder: (_, i) => Card(
                                      child: ListTile(
                                        title: Text('Order #${_deliveryHistory[i]['id']}'),
                                        subtitle: Text('₹${_deliveryHistory[i]['total_amount']}'),
                                        trailing: const Icon(Icons.check_circle, color: ZamzaColors.success),
                                      ),
                                    ),
                                  ),
                          ),
                        ]),
                      ),
                    ]),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _statItem(IconData icon, String value, String label) {
    return Column(
      children: [
        Icon(icon, color: Colors.white, size: 28),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.white)),
        Text(label, style: TextStyle(color: Colors.white.withOpacity(0.8), fontSize: 12)),
      ],
    );
  }
}