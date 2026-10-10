import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/formatters.dart';
import '../../core/translation_manager.dart';
import '../../models/cart.dart';
import '../../models/menu_item.dart';
import '../../models/restaurant.dart';
import '../../providers/auth_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/config_provider.dart';
import '../../providers/restaurant_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/common/buttons.dart';
import '../../widgets/common/cards.dart';
import '../../widgets/common/states.dart';
import '../../widgets/dynamic/offer_card.dart';
import 'customer_shell.dart';

class RestaurantDetailScreen extends ConsumerStatefulWidget {
  final String restaurantId;
  const RestaurantDetailScreen({super.key, required this.restaurantId});
  @override
  ConsumerState<RestaurantDetailScreen> createState() => _RestaurantDetailScreenState();
}

class _RestaurantDetailScreenState extends ConsumerState<RestaurantDetailScreen> {
  bool _vegOnly = false;
  bool? _favorite;

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(restaurantDetailProvider(widget.restaurantId));
    final cart = ref.watch(cartProvider);
    return Scaffold(
      bottomSheet: cart.isEmpty ? null : const CartBar(),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => Scaffold(appBar: AppBar(), body: ErrorView(error: e, onRetry: () => ref.invalidate(restaurantDetailProvider(widget.restaurantId)))),
        data: (r) => _content(r),
      ),
    );
  }

  Widget _content(Restaurant r) {
    final cfg = ref.watch(appConfigProvider);
    final text = Theme.of(context).textTheme;
    final scheme = Theme.of(context).colorScheme;
    final isFav = _favorite ?? r.isFavorite;
    final menuAsync = ref.watch(menuProvider((id: r.id, vegOnly: _vegOnly)));
    return CustomScrollView(slivers: [
      SliverAppBar(
        expandedHeight: 200,
        pinned: true,
        flexibleSpace: FlexibleSpaceBar(background: NetImage(r.coverImage, fit: BoxFit.cover)),
        actions: [
          if (cfg.feature('favorites') && ref.watch(authProvider).isLoggedIn)
            IconButton(
              icon: Icon(isFav ? Icons.favorite : Icons.favorite_border, color: isFav ? scheme.primary : null),
              onPressed: () async {
                try {
                  final res = await ApiService.instance.toggleFavorite(r.id);
                  setState(() => _favorite = res['isFavorite'] == true);
                  ref.invalidate(favoritesProvider);
                } catch (e) {
                  if (mounted) showError(context, e);
                }
              },
            ),
          if (cfg.feature('chatWithVendor') && r.phone.isNotEmpty)
            IconButton(icon: const Icon(Icons.call_outlined), onPressed: () => launchUrl(Uri.parse('tel:${r.phone}'))),
        ],
      ),
      SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(child: Text(r.name, style: text.headlineSmall?.copyWith(fontWeight: FontWeight.w800))),
              RatingBadge(rating: r.rating, count: r.ratingCount),
            ]),
            const SizedBox(height: 4),
            Text(r.cuisines.join(', '), style: text.bodyMedium),
            if (r.fullAddress.isNotEmpty) Text(r.fullAddress, style: text.bodySmall),
            const SizedBox(height: 8),
            Wrap(spacing: 12, children: [
              if (r.avgPrepTimeMinutes > 0) Chip(avatar: const Icon(Icons.timer_outlined, size: 18), label: Text(Fmt.minutes(r.avgPrepTimeMinutes))),
              if (r.priceForTwo > 0) Chip(label: Text(tr('restaurant.priceForTwo', {'price': Fmt.money(r.priceForTwo)}))),
              if (r.isPureVeg) Chip(avatar: const VegBadge(isVeg: true), label: Text(tr('restaurant.pureVeg'))),
              if (!r.isOpenNow) Chip(backgroundColor: scheme.errorContainer, label: Text(tr('restaurant.closedNow'))),
            ]),
            if (r.description.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 8), child: Text(r.description)),
            if (r.offers.isNotEmpty && cfg.feature('coupons')) ...[
              const SizedBox(height: 12),
              SizedBox(
                height: 104,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: r.offers.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 10),
                  itemBuilder: (_, i) => OfferCard(coupon: r.offers[i], width: 270),
                ),
              ),
            ],
            const SizedBox(height: 8),
            Row(children: [
              if (cfg.feature('vegOnlyFilter') && !r.isPureVeg) ...[
                Switch(value: _vegOnly, onChanged: (v) => setState(() => _vegOnly = v)),
                Text(tr('filter.vegOnly')),
              ],
              const Spacer(),
              if (cfg.feature('reviews'))
                TextButton.icon(onPressed: () => _showReviews(r), icon: const Icon(Icons.reviews_outlined), label: Text(tr('restaurant.reviews'))),
            ]),
          ]),
        ),
      ),
      ...menuAsync.when(
        loading: () => [const SliverToBoxAdapter(child: LoadingView())],
        error: (e, _) => [SliverToBoxAdapter(child: ErrorView(error: e))],
        data: (menu) => [
          if (menu.recommended.isNotEmpty) ...[
            SliverToBoxAdapter(child: SectionHeader(title: tr('menu.recommended'))),
            SliverList.builder(itemCount: menu.recommended.length, itemBuilder: (_, i) => MenuItemTile(item: menu.recommended[i], restaurant: r)),
          ],
          for (final c in menu.categories.where((c) => c.items.isNotEmpty)) ...[
            SliverToBoxAdapter(child: SectionHeader(title: tr('menu.categoryWithCount', {'name': c.name, 'count': c.items.length}))),
            SliverList.builder(itemCount: c.items.length, itemBuilder: (_, i) => MenuItemTile(item: c.items[i], restaurant: r)),
          ],
          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
    ]);
  }

  void _showReviews(Restaurant r) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (_) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.7,
        builder: (_, controller) => Consumer(builder: (context, ref, _) {
          final async = ref.watch(reviewsProvider(r.id));
          return async.when(
            loading: () => const LoadingView(),
            error: (e, _) => ErrorView(error: e),
            data: (list) => list.isEmpty
                ? const EmptyState(icon: Icons.rate_review_outlined, titleKey: 'review.none')
                : ListView.separated(
                    controller: controller,
                    padding: const EdgeInsets.all(16),
                    itemCount: list.length,
                    separatorBuilder: (_, __) => const Divider(),
                    itemBuilder: (_, i) {
                      final rv = list[i];
                      return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(children: [
                          ClipOval(child: NetImage(rv.userAvatar, width: 32, height: 32, placeholderIcon: Icons.person)),
                          const SizedBox(width: 8),
                          Expanded(child: Text(rv.userName, style: const TextStyle(fontWeight: FontWeight.w600))),
                          RatingBadge(rating: rv.rating.toDouble()),
                        ]),
                        if (rv.comment.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 6), child: Text(rv.comment)),
                        if (rv.reply.isNotEmpty)
                          Padding(
                              padding: const EdgeInsets.only(top: 6),
                              child: Text(tr('review.restaurantReply', {'reply': rv.reply}), style: Theme.of(context).textTheme.bodySmall)),
                        Text(Fmt.date(rv.createdAt), style: Theme.of(context).textTheme.bodySmall),
                      ]);
                    },
                  ),
          );
        }),
      ),
    );
  }
}

class MenuItemTile extends ConsumerWidget {
  final MenuItem item;
  final Restaurant restaurant;
  const MenuItemTile({super.key, required this.item, required this.restaurant});

  Future<void> _add(BuildContext context, WidgetRef ref, {List<CartAddOnSelection> addOns = const [], int qty = 1, String instructions = ''}) async {
    final n = ref.read(cartProvider.notifier);
    var r = n.add(item, restaurantName: restaurant.name, addOns: addOns, quantity: qty, instructions: instructions);
    if (r == AddResult.differentRestaurant) {
      final ok = await confirmDialog(context, titleKey: 'cart.replaceTitle', messageKey: 'cart.replaceMessage', confirmKey: 'cart.replace');
      if (ok) n.add(item, restaurantName: restaurant.name, addOns: addOns, quantity: qty, instructions: instructions, replace: true);
    }
  }

  Future<void> _openDetail(BuildContext context, WidgetRef ref) async {
    final result = await showModalBottomSheet<({List<CartAddOnSelection> addOns, int qty, String instructions})>(
      context: context,
      isScrollControlled: true,
      builder: (_) => ItemDetailSheet(item: item),
    );
    if (result != null && context.mounted) await _add(context, ref, addOns: result.addOns, qty: result.qty, instructions: result.instructions);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final qty = ref.watch(cartProvider).quantityOf(item.id);
    final text = Theme.of(context).textTheme;
    final canOrder = item.isAvailable && restaurant.isOpenNow;
    return InkWell(
      onTap: () => _openDetail(context, ref),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                VegBadge(isVeg: item.isVeg),
                if (item.isBestseller) ...[
                  const SizedBox(width: 6),
                  Text(tr('menu.bestseller'), style: text.labelSmall?.copyWith(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.bold)),
                ],
              ]),
              const SizedBox(height: 4),
              Text(item.name, style: text.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
              Row(children: [
                Text(Fmt.money(item.effectivePrice), style: text.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
                if (item.hasDiscount) ...[
                  const SizedBox(width: 6),
                  Text(Fmt.money(item.price), style: text.bodySmall?.copyWith(decoration: TextDecoration.lineThrough)),
                ],
              ]),
              if (item.description.isNotEmpty) Text(item.description, maxLines: 2, overflow: TextOverflow.ellipsis, style: text.bodySmall),
              if (!item.isAvailable) Text(tr('menu.unavailable'), style: text.bodySmall?.copyWith(color: Theme.of(context).colorScheme.error)),
            ]),
          ),
          const SizedBox(width: 12),
          Column(children: [
            NetImage(item.image, width: 110, height: 96, radius: 12, placeholderIcon: Icons.fastfood),
            const SizedBox(height: 6),
            if (canOrder)
              QuantityStepper(
                compact: true,
                quantity: qty,
                onAdd: () => item.addOns.isEmpty ? _add(context, ref) : _openDetail(context, ref),
                onRemove: () => ref.read(cartProvider.notifier).decrementItem(item.id),
              ),
          ]),
        ]),
      ),
    );
  }
}

/// Item detail with add-on groups (required/min/max enforced) and quantity.
class ItemDetailSheet extends StatefulWidget {
  final MenuItem item;
  const ItemDetailSheet({super.key, required this.item});
  @override
  State<ItemDetailSheet> createState() => _ItemDetailSheetState();
}

class _ItemDetailSheetState extends State<ItemDetailSheet> {
  final Map<String, Set<String>> _selected = {};
  final _note = TextEditingController();
  int _qty = 1;

  bool get _valid => widget.item.addOns.every((g) {
        final n = _selected[g.id]?.length ?? 0;
        final min = g.required ? (g.minSelect > 0 ? g.minSelect : 1) : g.minSelect;
        return n >= min && (g.maxSelect == 0 || n <= g.maxSelect);
      });

  double get _unit =>
      widget.item.effectivePrice +
      widget.item.addOns.fold<double>(0, (s, g) => s + g.options.where((o) => _selected[g.id]?.contains(o.id) ?? false).fold<double>(0, (x, o) => x + o.price));

  void _toggle(AddOnGroup g, AddOnOption o) {
    setState(() {
      final set = _selected.putIfAbsent(g.id, () => <String>{});
      if (g.maxSelect == 1) {
        set
          ..clear()
          ..add(o.id);
      } else if (set.contains(o.id)) {
        set.remove(o.id);
      } else if (g.maxSelect == 0 || set.length < g.maxSelect) {
        set.add(o.id);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final item = widget.item;
    final text = Theme.of(context).textTheme;
    return DraggableScrollableSheet(
      expand: false,
      initialChildSize: item.addOns.isEmpty ? 0.6 : 0.85,
      builder: (_, controller) => Column(children: [
        Expanded(
          child: ListView(controller: controller, padding: const EdgeInsets.all(16), children: [
            NetImage(item.image, height: 200, width: double.infinity, radius: 16, placeholderIcon: Icons.fastfood),
            const SizedBox(height: 12),
            Row(children: [
              VegBadge(isVeg: item.isVeg),
              const SizedBox(width: 8),
              Expanded(child: Text(item.name, style: text.titleLarge?.copyWith(fontWeight: FontWeight.w800)))
            ]),
            if (item.description.isNotEmpty) Padding(padding: const EdgeInsets.only(top: 6), child: Text(item.description)),
            for (final g in item.addOns) ...[
              const SizedBox(height: 16),
              Text(g.name, style: text.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
              Text(
                g.required ? tr('menu.requiredPick', {'max': g.maxSelect}) : tr('menu.optionalPick', {'max': g.maxSelect}),
                style: text.bodySmall,
              ),
              if (g.maxSelect == 1)
                RadioGroup<String>(
                  groupValue: _selected[g.id]?.firstOrNull,
                  onChanged: (id) => _toggle(g, g.options.firstWhere((o) => o.id == id)),
                  child: Column(children: [
                    for (final o in g.options.where((o) => o.isAvailable))
                      RadioListTile<String>(
                        contentPadding: EdgeInsets.zero,
                        value: o.id,
                        title: Row(children: [VegBadge(isVeg: o.isVeg, size: 12), const SizedBox(width: 8), Expanded(child: Text(o.name))]),
                        secondary: o.price > 0 ? Text('+${Fmt.money(o.price)}') : null,
                      ),
                  ]),
                )
              else
                for (final o in g.options.where((o) => o.isAvailable))
                  CheckboxListTile(
                    contentPadding: EdgeInsets.zero,
                    value: _selected[g.id]?.contains(o.id) ?? false,
                    onChanged: (_) => _toggle(g, o),
                    title: Row(children: [VegBadge(isVeg: o.isVeg, size: 12), const SizedBox(width: 8), Expanded(child: Text(o.name))]),
                    secondary: o.price > 0 ? Text('+${Fmt.money(o.price)}') : null,
                  ),
            ],
            const SizedBox(height: 12),
            TextField(controller: _note, decoration: InputDecoration(labelText: tr('menu.instructions'))),
          ]),
        ),
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(children: [
              QuantityStepper(quantity: _qty, onAdd: () => setState(() => _qty++), onRemove: () => setState(() => _qty = _qty > 1 ? _qty - 1 : 1)),
              const SizedBox(width: 12),
              Expanded(
                child: AppButton(
                  labelKey: 'menu.addItemTotal',
                  vars: {'total': Fmt.money(_unit * _qty)},
                  onPressed: !_valid || !item.isAvailable
                      ? null
                      : () => Navigator.pop(context, (
                            addOns: item.addOns
                                .where((g) => (_selected[g.id] ?? {}).isNotEmpty)
                                .map((g) => CartAddOnSelection(g.id, g.name, g.options.where((o) => _selected[g.id]!.contains(o.id)).toList()))
                                .toList(),
                            qty: _qty,
                            instructions: _note.text.trim(),
                          )),
                ),
              ),
            ]),
          ),
        ),
      ]),
    );
  }
}
