import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/formatters.dart';
import '../../core/routes.dart';
import '../../core/translation_manager.dart';
import '../../models/json_utils.dart';
import '../../models/menu_item.dart';
import '../../services/api_service.dart';
import '../../widgets/common/buttons.dart';
import '../../widgets/common/cards.dart';
import '../../widgets/common/inputs.dart';
import '../../widgets/common/states.dart';

final vendorCategoriesProvider = FutureProvider.autoDispose<List<MenuCategory>>((ref) async {
  final list = await ApiService.instance.menuCategories();
  return list.map((e) => MenuCategory.fromJson(toMap(e))).toList();
});

final vendorItemsProvider = FutureProvider.autoDispose<List<MenuItem>>((ref) async {
  final list = await ApiService.instance.menuItems();
  return list.map((e) => MenuItem.fromJson(toMap(e))).toList();
});

class VendorMenuTab extends ConsumerWidget {
  const VendorMenuTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cats = ref.watch(vendorCategoriesProvider);
    final items = ref.watch(vendorItemsProvider);
    return Scaffold(
      appBar: AppBar(
        title: Text(tr('vendor.nav.menu')),
        automaticallyImplyLeading: false,
        actions: [
          TextButton.icon(
              onPressed: () => Navigator.pushNamed(context, Routes.vendorCategories),
              icon: const Icon(Icons.category_outlined),
              label: Text(tr('vendor.categories')))
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          await Navigator.pushNamed(context, Routes.vendorItemForm);
          ref.invalidate(vendorItemsProvider);
        },
        icon: const Icon(Icons.add),
        label: Text(tr('vendor.addItem')),
      ),
      body: cats.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(error: e, onRetry: () => ref.invalidate(vendorCategoriesProvider)),
        data: (categories) => items.when(
          loading: () => const LoadingView(),
          error: (e, _) => ErrorView(error: e, onRetry: () => ref.invalidate(vendorItemsProvider)),
          data: (all) {
            if (categories.isEmpty) {
              return EmptyState(
                  icon: Icons.category_outlined,
                  titleKey: 'vendor.noCategories',
                  actionKey: 'vendor.categories',
                  onAction: () => Navigator.pushNamed(context, Routes.vendorCategories));
            }
            return RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(vendorCategoriesProvider);
                ref.invalidate(vendorItemsProvider);
              },
              child: ListView(padding: const EdgeInsets.only(bottom: 90), children: [
                for (final c in categories) ...[
                  SectionHeader(title: tr('menu.categoryWithCount', {'name': c.name, 'count': all.where((i) => i.categoryId == c.id).length})),
                  for (final item in all.where((i) => i.categoryId == c.id))
                    ListTile(
                      leading: NetImage(item.image, width: 52, height: 52, radius: 8, placeholderIcon: Icons.fastfood),
                      title: Row(children: [VegBadge(isVeg: item.isVeg, size: 12), const SizedBox(width: 6), Expanded(child: Text(item.name))]),
                      subtitle: Text(Fmt.money(item.effectivePrice)),
                      trailing: Switch(
                        value: item.isAvailable,
                        onChanged: (v) async {
                          try {
                            await ApiService.instance.toggleItemAvailability(item.id, v);
                            ref.invalidate(vendorItemsProvider);
                          } catch (e) {
                            if (context.mounted) showError(context, e);
                          }
                        },
                      ),
                      onTap: () async {
                        await Navigator.pushNamed(context, Routes.vendorItemForm, arguments: item);
                        ref.invalidate(vendorItemsProvider);
                      },
                    ),
                ],
              ]),
            );
          },
        ),
      ),
    );
  }
}

class VendorCategoriesScreen extends ConsumerWidget {
  const VendorCategoriesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(vendorCategoriesProvider);
    Future<void> edit([MenuCategory? c]) async {
      final name = await promptDialog(context,
          titleKey: c == null ? 'vendor.addCategory' : 'vendor.editCategory', labelKey: 'vendor.categoryName', initial: c?.name ?? '');
      if (name == null || name.isEmpty) return;
      try {
        if (c == null) {
          await ApiService.instance.createMenuCategory({'name': name});
        } else {
          await ApiService.instance.updateMenuCategory(c.id, {'name': name});
        }
        ref.invalidate(vendorCategoriesProvider);
      } catch (e) {
        if (context.mounted) showError(context, e);
      }
    }

    return Scaffold(
      appBar: AppBar(title: Text(tr('vendor.categories'))),
      floatingActionButton: FloatingActionButton(onPressed: () => edit(), child: const Icon(Icons.add)),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(error: e, onRetry: () => ref.invalidate(vendorCategoriesProvider)),
        data: (list) => list.isEmpty
            ? const EmptyState(icon: Icons.category_outlined, titleKey: 'vendor.noCategories')
            : ListView(
                children: list
                    .map((c) => ListTile(
                          title: Text(c.name),
                          subtitle: Text(tr('vendor.itemsCount', {'count': c.itemCount})),
                          leading: Switch(
                            value: c.isActive,
                            onChanged: (v) async {
                              await ApiService.instance.updateMenuCategory(c.id, {'isActive': v});
                              ref.invalidate(vendorCategoriesProvider);
                            },
                          ),
                          trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                            IconButton(icon: const Icon(Icons.edit_outlined), onPressed: () => edit(c)),
                            IconButton(
                              icon: const Icon(Icons.delete_outline),
                              onPressed: () async {
                                if (!await confirmDialog(context, titleKey: 'vendor.deleteCategory')) return;
                                try {
                                  await ApiService.instance.deleteMenuCategory(c.id);
                                  ref.invalidate(vendorCategoriesProvider);
                                } catch (e) {
                                  if (context.mounted) showError(context, e);
                                }
                              },
                            ),
                          ]),
                        ))
                    .toList(),
              ),
      ),
    );
  }
}

/// Create / edit menu item including image upload and add-on groups.
class VendorItemFormScreen extends ConsumerStatefulWidget {
  final Object? item;
  const VendorItemFormScreen({super.key, this.item});
  @override
  ConsumerState<VendorItemFormScreen> createState() => _VendorItemFormScreenState();
}

class _EditableGroup {
  String id;
  final TextEditingController name;
  bool required;
  int maxSelect;
  final List<({String id, TextEditingController name, TextEditingController price})> options;
  _EditableGroup(this.id, String n, this.required, this.maxSelect, this.options) : name = TextEditingController(text: n);
}

class _VendorItemFormScreenState extends ConsumerState<VendorItemFormScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _desc = TextEditingController();
  final _price = TextEditingController();
  final _discount = TextEditingController();
  String _image = '';
  String? _category;
  bool _isVeg = true;
  bool _available = true;
  bool _bestseller = false;
  bool _saving = false;
  final List<_EditableGroup> _groups = [];

  MenuItem? get _item => widget.item is MenuItem ? widget.item as MenuItem : null;

  @override
  void initState() {
    super.initState();
    final i = _item;
    if (i != null) {
      _name.text = i.name;
      _desc.text = i.description;
      _price.text = i.price.toString();
      _discount.text = i.discountPrice?.toString() ?? '';
      _image = i.image;
      _category = i.categoryId;
      _isVeg = i.isVeg;
      _available = i.isAvailable;
      _bestseller = i.isBestseller;
      for (final g in i.addOns) {
        _groups.add(_EditableGroup(
          g.id,
          g.name,
          g.required,
          g.maxSelect,
          g.options.map((o) => (id: o.id, name: TextEditingController(text: o.name), price: TextEditingController(text: o.price.toString()))).toList(),
        ));
      }
    }
  }

  Future<void> _pickImage() async {
    final f = await ImagePicker().pickImage(source: ImageSource.gallery, maxWidth: 1200);
    if (f == null) return;
    try {
      final url = await ApiService.instance.upload(f.path, folder: 'menu');
      setState(() => _image = url);
    } catch (e) {
      if (mounted) showError(context, e);
    }
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate() || _category == null) return;
    setState(() => _saving = true);
    final body = {
      'name': _name.text.trim(),
      'description': _desc.text.trim(),
      'price': double.parse(_price.text.trim()),
      'discountPrice': _discount.text.trim().isEmpty ? null : double.tryParse(_discount.text.trim()),
      'image': _image,
      'category': _category,
      'isVeg': _isVeg,
      'isAvailable': _available,
      'isBestseller': _bestseller,
      'addOns': _groups
          .where((g) => g.name.text.trim().isNotEmpty)
          .map((g) => AddOnGroup(
                g.id,
                g.name.text.trim(),
                g.required,
                g.required ? 1 : 0,
                g.maxSelect,
                g.options
                    .where((o) => o.name.text.trim().isNotEmpty)
                    .map((o) => AddOnOption(o.id, o.name.text.trim(), double.tryParse(o.price.text) ?? 0, true, true))
                    .toList(),
              ).toJson())
          .toList(),
    };
    try {
      if (_item == null) {
        await ApiService.instance.createMenuItem(body);
      } else {
        await ApiService.instance.updateMenuItem(_item!.id, body);
      }
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final cats = ref.watch(vendorCategoriesProvider).valueOrNull ?? [];
    return Scaffold(
      appBar: AppBar(
        title: Text(tr(_item == null ? 'vendor.addItem' : 'vendor.editItem')),
        actions: [
          if (_item != null)
            IconButton(
              icon: const Icon(Icons.delete_outline),
              onPressed: () async {
                if (!await confirmDialog(context, titleKey: 'vendor.deleteItem')) return;
                await ApiService.instance.deleteMenuItem(_item!.id);
                if (context.mounted) Navigator.pop(context);
              },
            ),
        ],
      ),
      body: Form(
        key: _form,
        child: ListView(padding: const EdgeInsets.all(16), children: [
          GestureDetector(
            onTap: _pickImage,
            child: Stack(children: [
              NetImage(_image, height: 180, width: double.infinity, radius: 12, placeholderIcon: Icons.add_a_photo_outlined),
              Positioned(right: 8, bottom: 8, child: CircleAvatar(child: const Icon(Icons.camera_alt_outlined))),
            ]),
          ),
          const SizedBox(height: 16),
          AppInput(controller: _name, labelKey: 'vendor.itemName', validator: Validators.required),
          AppInput(controller: _desc, labelKey: 'vendor.itemDescription', maxLines: 3),
          Row(children: [
            Expanded(child: AppInput(controller: _price, labelKey: 'vendor.price', keyboardType: TextInputType.number, validator: Validators.number)),
            const SizedBox(width: 12),
            Expanded(child: AppInput(controller: _discount, labelKey: 'vendor.discountPrice', keyboardType: TextInputType.number)),
          ]),
          DropdownButtonFormField<String>(
            initialValue: cats.any((c) => c.id == _category) ? _category : null,
            items: cats.map((c) => DropdownMenuItem(value: c.id, child: Text(c.name))).toList(),
            onChanged: (v) => setState(() => _category = v),
            validator: (v) => v == null ? tr('validation.required') : null,
            decoration: InputDecoration(labelText: tr('vendor.category')),
          ),
          SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _isVeg,
              onChanged: (v) => setState(() => _isVeg = v),
              title: Text(tr('menu.veg')),
              secondary: VegBadge(isVeg: _isVeg)),
          SwitchListTile(
              contentPadding: EdgeInsets.zero, value: _available, onChanged: (v) => setState(() => _available = v), title: Text(tr('vendor.available'))),
          SwitchListTile(
              contentPadding: EdgeInsets.zero, value: _bestseller, onChanged: (v) => setState(() => _bestseller = v), title: Text(tr('menu.bestseller'))),
          const Divider(),
          Row(children: [
            Expanded(child: Text(tr('vendor.addOns'), style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700))),
            TextButton.icon(
              onPressed: () => setState(() => _groups.add(_EditableGroup('', '', false, 1, []))),
              icon: const Icon(Icons.add),
              label: Text(tr('vendor.addGroup')),
            ),
          ]),
          for (final g in _groups)
            AppCard(
              child: Column(children: [
                Row(children: [
                  Expanded(child: TextField(controller: g.name, decoration: InputDecoration(labelText: tr('vendor.groupName')))),
                  IconButton(icon: const Icon(Icons.delete_outline), onPressed: () => setState(() => _groups.remove(g))),
                ]),
                Row(children: [
                  Checkbox(value: g.required, onChanged: (v) => setState(() => g.required = v ?? false)),
                  Text(tr('vendor.required')),
                  const Spacer(),
                  Text(tr('vendor.maxSelect')),
                  IconButton(icon: const Icon(Icons.remove), onPressed: () => setState(() => g.maxSelect = g.maxSelect > 1 ? g.maxSelect - 1 : 1)),
                  Text('${g.maxSelect}'),
                  IconButton(icon: const Icon(Icons.add), onPressed: () => setState(() => g.maxSelect++)),
                ]),
                for (final o in g.options)
                  Row(children: [
                    Expanded(flex: 3, child: TextField(controller: o.name, decoration: InputDecoration(labelText: tr('vendor.optionName')))),
                    const SizedBox(width: 8),
                    Expanded(
                        flex: 2,
                        child: TextField(controller: o.price, keyboardType: TextInputType.number, decoration: InputDecoration(labelText: tr('vendor.price')))),
                    IconButton(icon: const Icon(Icons.close), onPressed: () => setState(() => g.options.remove(o))),
                  ]),
                Align(
                  alignment: AlignmentDirectional.centerStart,
                  child: TextButton(
                    onPressed: () => setState(() => g.options.add((id: '', name: TextEditingController(), price: TextEditingController(text: '0')))),
                    child: Text(tr('vendor.addOption')),
                  ),
                ),
              ]),
            ),
          const SizedBox(height: 20),
          AppButton(labelKey: 'common.save', loading: _saving, onPressed: _save),
        ]),
      ),
    );
  }
}
