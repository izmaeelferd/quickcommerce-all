import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/routes.dart';
import '../../core/translation_manager.dart';
import '../../models/address.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../services/api_service.dart';
import '../../services/location_service.dart';
import '../../widgets/common/buttons.dart';
import '../../widgets/common/cards.dart';
import '../../widgets/common/inputs.dart';
import '../../widgets/common/states.dart';

class AddressListScreen extends ConsumerWidget {
  final bool selectMode;
  const AddressListScreen({super.key, this.selectMode = false});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final list = user?.addresses ?? [];
    final selected = ref.watch(checkoutProvider).addressId;
    return Scaffold(
      appBar: AppBar(title: Text(tr('address.title'))),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => Navigator.pushNamed(context, Routes.addAddress),
        icon: const Icon(Icons.add_location_alt_outlined),
        label: Text(tr('address.add')),
      ),
      body: list.isEmpty
          ? EmptyState(
              icon: Icons.location_off_outlined,
              titleKey: 'address.empty',
              actionKey: 'address.add',
              onAction: () => Navigator.pushNamed(context, Routes.addAddress))
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: list.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, i) {
                final a = list[i];
                return AppCard(
                  onTap: () {
                    ref.read(checkoutProvider.notifier).state = ref.read(checkoutProvider).copyWith(addressId: a.id);
                    if (selectMode) Navigator.pop(context);
                  },
                  child: Row(children: [
                    Icon(a.label.toLowerCase().contains('work') ? Icons.work_outline : Icons.home_outlined),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(children: [
                          Text(a.label, style: const TextStyle(fontWeight: FontWeight.w700)),
                          if (a.isDefault) ...[const SizedBox(width: 8), Chip(label: Text(tr('address.default')), visualDensity: VisualDensity.compact)],
                        ]),
                        Text(a.fullAddress),
                        if (a.landmark.isNotEmpty) Text(a.landmark, style: Theme.of(context).textTheme.bodySmall),
                      ]),
                    ),
                    if (selectMode && selected == a.id) Icon(Icons.check_circle, color: Theme.of(context).colorScheme.primary),
                    PopupMenuButton<String>(
                      onSelected: (v) async {
                        try {
                          if (v == 'edit') {
                            await Navigator.pushNamed(context, Routes.addAddress, arguments: a);
                          } else if (v == 'default') {
                            await ApiService.instance.updateAddress(a.id, {'isDefault': true});
                            await ref.read(authProvider.notifier).refresh();
                          } else if (v == 'delete') {
                            if (!await confirmDialog(context, titleKey: 'address.deleteConfirm')) return;
                            await ApiService.instance.deleteAddress(a.id);
                            await ref.read(authProvider.notifier).refresh();
                          }
                        } catch (e) {
                          if (context.mounted) showError(context, e);
                        }
                      },
                      itemBuilder: (_) => [
                        PopupMenuItem(value: 'edit', child: Text(tr('common.edit'))),
                        if (!a.isDefault) PopupMenuItem(value: 'default', child: Text(tr('address.makeDefault'))),
                        PopupMenuItem(value: 'delete', child: Text(tr('common.delete'))),
                      ],
                    ),
                  ]),
                );
              },
            ),
    );
  }
}

class AddAddressScreen extends ConsumerStatefulWidget {
  final Object? existing;
  const AddAddressScreen({super.key, this.existing});
  @override
  ConsumerState<AddAddressScreen> createState() => _AddAddressScreenState();
}

class _AddAddressScreenState extends ConsumerState<AddAddressScreen> {
  final _form = GlobalKey<FormState>();
  final _label = TextEditingController();
  final _full = TextEditingController();
  final _landmark = TextEditingController();
  final _city = TextEditingController();
  final _pincode = TextEditingController();
  final _contactName = TextEditingController();
  final _contactPhone = TextEditingController();
  double? _lat;
  double? _lng;
  bool _isDefault = false;
  bool _saving = false;
  bool _locating = false;

  Address? get _existing => widget.existing is Address ? widget.existing as Address : null;

  @override
  void initState() {
    super.initState();
    final a = _existing;
    _label.text = a?.label ?? tr('address.home');
    _full.text = a?.fullAddress ?? '';
    _landmark.text = a?.landmark ?? '';
    _city.text = a?.city ?? '';
    _pincode.text = a?.pincode ?? '';
    _contactName.text = a?.contactName ?? ref.read(authProvider).user?.name ?? '';
    _contactPhone.text = a?.contactPhone ?? ref.read(authProvider).user?.phone ?? '';
    _lat = a?.lat;
    _lng = a?.lng;
    _isDefault = a?.isDefault ?? false;
    if (a == null) _locate();
  }

  Future<void> _locate() async {
    setState(() => _locating = true);
    final p = await LocationService.instance.current();
    if (mounted) {
      setState(() {
        _locating = false;
        if (p != null) {
          _lat = p.latitude;
          _lng = p.longitude;
        }
      });
    }
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _saving = true);
    final a = Address(
      id: _existing?.id ?? '',
      label: _label.text.trim(),
      fullAddress: _full.text.trim(),
      landmark: _landmark.text.trim(),
      city: _city.text.trim(),
      pincode: _pincode.text.trim(),
      contactName: _contactName.text.trim(),
      contactPhone: _contactPhone.text.trim(),
      lat: _lat,
      lng: _lng,
      isDefault: _isDefault,
    );
    try {
      final list = _existing == null ? await ApiService.instance.addAddress(a.toJson()) : await ApiService.instance.updateAddress(_existing!.id, a.toJson());
      await ref.read(authProvider.notifier).refresh();
      if (_existing == null && list.isNotEmpty) {
        final added = Address.fromJson(Map<String, dynamic>.from(list.last as Map));
        ref.read(checkoutProvider.notifier).state = ref.read(checkoutProvider).copyWith(addressId: added.id);
      }
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(tr(_existing == null ? 'address.add' : 'address.edit'))),
        body: Form(
          key: _form,
          child: ListView(padding: const EdgeInsets.all(16), children: [
            AppCard(
              child: Row(children: [
                Icon(_lat != null ? Icons.my_location : Icons.location_searching, color: Theme.of(context).colorScheme.primary),
                const SizedBox(width: 10),
                Expanded(child: Text(_lat != null ? tr('address.locationCaptured') : tr('address.locationMissing'))),
                _locating
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : TextButton(onPressed: _locate, child: Text(tr('address.useCurrent'))),
              ]),
            ),
            const SizedBox(height: 16),
            Wrap(spacing: 8, children: [
              for (final k in const ['address.home', 'address.work', 'address.other'])
                ChoiceChip(label: Text(tr(k)), selected: _label.text == tr(k), onSelected: (_) => setState(() => _label.text = tr(k))),
            ]),
            const SizedBox(height: 12),
            AppInput(controller: _label, labelKey: 'address.label', validator: Validators.required),
            AppInput(controller: _full, labelKey: 'address.full', maxLines: 2, validator: Validators.required),
            AppInput(controller: _landmark, labelKey: 'address.landmark'),
            Row(children: [
              Expanded(child: AppInput(controller: _city, labelKey: 'address.city')),
              const SizedBox(width: 12),
              Expanded(child: AppInput(controller: _pincode, labelKey: 'address.pincode', keyboardType: TextInputType.number)),
            ]),
            AppInput(controller: _contactName, labelKey: 'address.contactName'),
            AppInput(controller: _contactPhone, labelKey: 'address.contactPhone', keyboardType: TextInputType.phone),
            SwitchListTile(
                contentPadding: EdgeInsets.zero, value: _isDefault, onChanged: (v) => setState(() => _isDefault = v), title: Text(tr('address.makeDefault'))),
            const SizedBox(height: 12),
            AppButton(labelKey: 'common.save', loading: _saving, onPressed: _save),
          ]),
        ),
      );
}
