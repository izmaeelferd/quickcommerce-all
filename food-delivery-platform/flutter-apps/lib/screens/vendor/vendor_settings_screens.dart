import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/formatters.dart';
import '../../core/routes.dart';
import '../../core/translation_manager.dart';
import '../../models/json_utils.dart';
import '../../models/restaurant.dart';
import '../../providers/auth_provider.dart';
import '../../providers/config_provider.dart';
import '../../services/api_service.dart';
import '../../services/location_service.dart';
import '../../widgets/common/buttons.dart';
import '../../widgets/common/cards.dart';
import '../../widgets/common/inputs.dart';
import '../../widgets/common/states.dart';

class VendorMoreTab extends ConsumerWidget {
  const VendorMoreTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    Widget tile(IconData i, String k, String route) =>
        ListTile(leading: Icon(i), title: Text(tr(k)), trailing: const Icon(Icons.chevron_right), onTap: () => Navigator.pushNamed(context, route));
    return Scaffold(
      appBar: AppBar(title: Text(tr('vendor.nav.more')), automaticallyImplyLeading: false),
      body: ListView(children: [
        tile(Icons.storefront_outlined, 'vendor.restaurantProfile', Routes.vendorProfile),
        tile(Icons.schedule, 'vendor.timings', Routes.vendorTimings),
        tile(Icons.account_balance_wallet_outlined, 'vendor.earnings', Routes.vendorEarnings),
        tile(Icons.category_outlined, 'vendor.categories', Routes.vendorCategories),
        tile(Icons.notifications_none, 'notifications.title', Routes.notifications),
        tile(Icons.settings_outlined, 'settings.title', Routes.settings),
      ]),
    );
  }
}

class VendorTimingsScreen extends ConsumerStatefulWidget {
  const VendorTimingsScreen({super.key});
  @override
  ConsumerState<VendorTimingsScreen> createState() => _VendorTimingsScreenState();
}

class _VendorTimingsScreenState extends ConsumerState<VendorTimingsScreen> {
  late List<Timing> _timings;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final existing = ref.read(authProvider).restaurant?.timings ?? [];
    _timings = List.generate(7, (d) => existing.firstWhere((t) => t.day == d, orElse: () => Timing(d, '09:00', '23:00', false)));
  }

  Future<void> _pick(int i, bool open) async {
    final t = _timings[i];
    final parts = (open ? t.open : t.close).split(':');
    final picked = await showTimePicker(context: context, initialTime: TimeOfDay(hour: int.parse(parts[0]), minute: int.parse(parts[1])));
    if (picked == null) return;
    final v = '${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}';
    setState(() => _timings[i] = open ? t.copyWith(open: v) : t.copyWith(close: v));
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      ref.read(authProvider.notifier).updateRestaurant(await ApiService.instance.updateTimings(_timings.map((t) => t.toJson()).toList()));
      if (mounted) showMessage(context, 'vendor.timingsSaved');
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(tr('vendor.timings'))),
        body: ListView.builder(
          padding: const EdgeInsets.all(12),
          itemCount: 7,
          itemBuilder: (_, i) {
            final t = _timings[i];
            return Card(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                child: Row(children: [
                  SizedBox(width: 90, child: Text(tr('day.$i'), style: const TextStyle(fontWeight: FontWeight.w600))),
                  Switch(value: !t.closed, onChanged: (v) => setState(() => _timings[i] = t.copyWith(closed: !v))),
                  const Spacer(),
                  if (!t.closed) ...[
                    TextButton(onPressed: () => _pick(i, true), child: Text(t.open)),
                    const Text('–'),
                    TextButton(onPressed: () => _pick(i, false), child: Text(t.close)),
                  ] else
                    Text(tr('vendor.closed')),
                ]),
              ),
            );
          },
        ),
        bottomNavigationBar:
            SafeArea(child: Padding(padding: const EdgeInsets.all(16), child: AppButton(labelKey: 'common.save', loading: _saving, onPressed: _save))),
      );
}

final vendorPayoutsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) => ApiService.instance.vendorPayouts());

/// Earnings & payouts. Commission % shown is the effective one from config/override.
class VendorEarningsScreen extends ConsumerWidget {
  const VendorEarningsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(vendorPayoutsProvider);
    final scheme = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: Text(tr('vendor.earnings'))),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(error: e, onRetry: () => ref.invalidate(vendorPayoutsProvider)),
        data: (d) {
          final settlements = toList(d['recentSettlements']).map((e) => toMap(e)).toList();
          final payouts = toList(d['items']).map((e) => toMap(e)).where((t) => t['type'] == 'vendor_payout').toList();
          return ListView(padding: const EdgeInsets.all(16), children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: scheme.primary, borderRadius: BorderRadius.circular(16)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(tr('vendor.pendingPayout'), style: TextStyle(color: scheme.onPrimary)),
                Text(Fmt.money(toDouble(d['walletBalance'])),
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: scheme.onPrimary, fontWeight: FontWeight.w800)),
                const SizedBox(height: 6),
                Text(tr('vendor.commissionInfo', {'percent': toDouble(d['commissionPercent']).toStringAsFixed(1)}), style: TextStyle(color: scheme.onPrimary)),
                Text(tr('vendor.minPayout', {'amount': Fmt.money(toDouble(d['minPayoutAmount']))}), style: TextStyle(color: scheme.onPrimary)),
              ]),
            ),
            const SizedBox(height: 16),
            Text(tr('vendor.payoutHistory'), style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
            if (payouts.isEmpty) Padding(padding: const EdgeInsets.all(12), child: Text(tr('vendor.noPayouts'))),
            for (final p in payouts)
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.account_balance),
                title: Text(Fmt.money(toDouble(p['amount']))),
                subtitle: Text(Fmt.dateTime(toDate(p['createdAt']))),
                trailing: Text(toStr(p['providerRef'])),
              ),
            const SizedBox(height: 16),
            Text(tr('vendor.settlements'), style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
            for (final s in settlements)
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(tr('order.number', {'number': toStr(s['orderNumber'])})),
                subtitle: Text(tr('vendor.settlementLine', {
                  'gross': Fmt.money(toDouble(toMap(s['pricing'])['subtotal'])),
                  'commission': Fmt.money(toDouble(toMap(s['commission'])['amount'])),
                })),
                trailing: Text(Fmt.money(toDouble(s['vendorEarning'])), style: const TextStyle(fontWeight: FontWeight.w700)),
              ),
          ]);
        },
      ),
    );
  }
}

/// Restaurant profile; also the onboarding screen when the vendor has no restaurant yet.
class VendorRestaurantProfileScreen extends ConsumerStatefulWidget {
  final bool onboarding;
  const VendorRestaurantProfileScreen({super.key, this.onboarding = false});
  @override
  ConsumerState<VendorRestaurantProfileScreen> createState() => _VendorRestaurantProfileScreenState();
}

class _VendorRestaurantProfileScreenState extends ConsumerState<VendorRestaurantProfileScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _desc = TextEditingController();
  final _phone = TextEditingController();
  final _address = TextEditingController();
  final _city = TextEditingController();
  final _priceForTwo = TextEditingController();
  final _prep = TextEditingController();
  final _offer = TextEditingController();
  final Set<String> _cuisines = {};
  String _logo = '';
  String _cover = '';
  bool _pureVeg = false;
  double? _lat;
  double? _lng;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final r = ref.read(authProvider).restaurant;
    if (r != null) {
      _name.text = r.name;
      _desc.text = r.description;
      _phone.text = r.phone;
      _address.text = r.fullAddress;
      _priceForTwo.text = r.priceForTwo.toStringAsFixed(0);
      _prep.text = '${r.avgPrepTimeMinutes}';
      _offer.text = r.offerText;
      _cuisines.addAll(r.cuisines);
      _logo = r.logo;
      _cover = r.coverImage;
      _pureVeg = r.isPureVeg;
      _lat = r.lat;
      _lng = r.lng;
    }
  }

  Future<void> _pick(bool logo) async {
    final f = await ImagePicker().pickImage(source: ImageSource.gallery, maxWidth: 1600);
    if (f == null) return;
    try {
      final url = await ApiService.instance.upload(f.path, folder: 'restaurants');
      setState(() => logo ? _logo = url : _cover = url);
    } catch (e) {
      if (mounted) showError(context, e);
    }
  }

  Future<void> _locate() async {
    final p = await LocationService.instance.current();
    if (p == null) return;
    setState(() {
      _lat = p.latitude;
      _lng = p.longitude;
    });
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _saving = true);
    final body = {
      'name': _name.text.trim(),
      'description': _desc.text.trim(),
      'phone': _phone.text.trim(),
      'address': {'fullAddress': _address.text.trim(), 'city': _city.text.trim()},
      'priceForTwo': double.tryParse(_priceForTwo.text) ?? 0,
      'avgPrepTimeMinutes': int.tryParse(_prep.text) ?? 0,
      'offerText': _offer.text.trim(),
      'cuisines': _cuisines.toList(),
      'logo': _logo,
      'coverImage': _cover,
      'isPureVeg': _pureVeg,
      if (_lat != null) 'lat': _lat,
      if (_lng != null) 'lng': _lng,
    };
    try {
      final res =
          ref.read(authProvider).restaurant == null ? await ApiService.instance.createRestaurant(body) : await ApiService.instance.updateMyRestaurant(body);
      ref.read(authProvider.notifier).updateRestaurant(toMap(res));
      if (mounted) {
        showMessage(context, 'vendor.profileSaved');
        if (!widget.onboarding) Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cuisines = ref.watch(appConfigProvider).cuisines;
    return Scaffold(
      appBar: AppBar(
        title: Text(tr(widget.onboarding ? 'vendor.setupTitle' : 'vendor.restaurantProfile')),
        automaticallyImplyLeading: !widget.onboarding,
        actions: [if (widget.onboarding) IconButton(icon: const Icon(Icons.settings_outlined), onPressed: () => Navigator.pushNamed(context, Routes.settings))],
      ),
      body: Form(
        key: _form,
        child: ListView(padding: const EdgeInsets.all(16), children: [
          if (widget.onboarding) Padding(padding: const EdgeInsets.only(bottom: 16), child: Text(tr('vendor.setupSubtitle'))),
          GestureDetector(
              onTap: () => _pick(false),
              child: NetImage(_cover, height: 150, width: double.infinity, radius: 12, placeholderIcon: Icons.add_photo_alternate_outlined)),
          const SizedBox(height: 12),
          Row(children: [
            GestureDetector(onTap: () => _pick(true), child: ClipOval(child: NetImage(_logo, width: 72, height: 72, placeholderIcon: Icons.storefront))),
            const SizedBox(width: 12),
            Expanded(child: Text(tr('vendor.tapToUpload'))),
          ]),
          const SizedBox(height: 16),
          AppInput(controller: _name, labelKey: 'vendor.restaurantName', validator: Validators.required),
          AppInput(controller: _desc, labelKey: 'vendor.description', maxLines: 3),
          AppInput(controller: _phone, labelKey: 'auth.phone', keyboardType: TextInputType.phone),
          AppInput(controller: _address, labelKey: 'address.full', maxLines: 2, validator: Validators.required),
          AppInput(controller: _city, labelKey: 'address.city'),
          ListTile(
            contentPadding: EdgeInsets.zero,
            leading: const Icon(Icons.my_location),
            title: Text(_lat == null ? tr('address.locationMissing') : tr('address.locationCaptured')),
            trailing: TextButton(onPressed: _locate, child: Text(tr('address.useCurrent'))),
          ),
          Row(children: [
            Expanded(child: AppInput(controller: _priceForTwo, labelKey: 'vendor.priceForTwo', keyboardType: TextInputType.number)),
            const SizedBox(width: 12),
            Expanded(child: AppInput(controller: _prep, labelKey: 'vendor.prepTime', keyboardType: TextInputType.number)),
          ]),
          AppInput(controller: _offer, labelKey: 'vendor.offerText'),
          SwitchListTile(
              contentPadding: EdgeInsets.zero, value: _pureVeg, onChanged: (v) => setState(() => _pureVeg = v), title: Text(tr('restaurant.pureVeg'))),
          if (cuisines.isNotEmpty) ...[
            Text(tr('vendor.cuisines'), style: const TextStyle(fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: cuisines
                  .map((c) => FilterChip(
                        label: Text(c.name),
                        selected: _cuisines.contains(c.name),
                        onSelected: (v) => setState(() => v ? _cuisines.add(c.name) : _cuisines.remove(c.name)),
                      ))
                  .toList(),
            ),
          ],
          const SizedBox(height: 20),
          AppButton(labelKey: widget.onboarding ? 'vendor.submitForApproval' : 'common.save', loading: _saving, onPressed: _save),
        ]),
      ),
    );
  }
}
