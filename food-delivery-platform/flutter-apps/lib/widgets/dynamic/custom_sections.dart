import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_widget_from_html_core/flutter_widget_from_html_core.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/dynamic_theme.dart';
import '../../core/env.dart';
import '../../core/formatters.dart';
import '../../core/routes.dart';
import '../../core/translation_manager.dart';
import '../../models/menu_item.dart';
import '../../models/widget_section.dart';
import '../../providers/restaurant_provider.dart';
import '../common/cards.dart';
import '../common/states.dart';
import 'restaurant_section.dart';
import 'section_link.dart';

/// Resolves server-relative upload paths (`/uploads/...`) against the API origin.
String _absoluteUrl(String url) => url.startsWith('/') ? '${Env.apiBaseUrl}$url' : url;

/// Applies the section's optional background color and vertical padding (Admin → Home layout → Style).
class StyledSection extends StatelessWidget {
  final WidgetSection section;
  final Widget child;
  const StyledSection({super.key, required this.section, required this.child});

  @override
  Widget build(BuildContext context) {
    // A promo's background color belongs to its card, not to the full-width section.
    final bg = section.type == 'promo' ? '' : section.backgroundColor;
    final pad = section.paddingVertical;
    if (bg.isEmpty && pad <= 0) return child;
    return Container(
      color: bg.isEmpty ? null : hexColor(bg, Colors.transparent),
      padding: EdgeInsets.symmetric(vertical: pad),
      child: child,
    );
  }
}

/// Promotional card: image, title, subtitle and an optional call-to-action link.
class PromoSection extends StatelessWidget {
  final WidgetSection section;
  final String title;
  const PromoSection({super.key, required this.section, required this.title});

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.of(context);
    final scheme = Theme.of(context).colorScheme;
    final hasImage = section.imageUrl.isNotEmpty;
    final fg = section.textColor.isNotEmpty ? hexColor(section.textColor, scheme.onPrimary) : (hasImage ? Colors.white : scheme.onPrimary);
    final bg = section.backgroundColor.isNotEmpty ? hexColor(section.backgroundColor, scheme.primary) : scheme.primary;
    final align = switch (section.textAlign) { 'center' => CrossAxisAlignment.center, 'end' => CrossAxisAlignment.end, _ => CrossAxisAlignment.start };
    final textAlign = switch (section.textAlign) { 'center' => TextAlign.center, 'end' => TextAlign.end, _ => TextAlign.start };
    final tappable = section.linkType != 'none';
    void open() => openSectionLink(context, section.linkType, section.linkValue, title: title);

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: Semantics(
        button: tappable,
        label: title,
        child: Material(
          color: bg,
          borderRadius: BorderRadius.circular(colors.cardRadius),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: tappable ? open : null,
            child: SizedBox(
              height: section.height,
              width: double.infinity,
              child: Stack(fit: StackFit.expand, children: [
                if (hasImage) NetImage(_absoluteUrl(section.imageUrl), fit: BoxFit.cover, placeholderIcon: Icons.image_outlined),
                if (hasImage)
                  const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(begin: Alignment.bottomCenter, end: Alignment.topCenter, colors: [Color(0xB3000000), Color(0x00000000)]),
                    ),
                  ),
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(mainAxisAlignment: MainAxisAlignment.end, crossAxisAlignment: align, children: [
                    if (title.isNotEmpty)
                      Text(title,
                          textAlign: textAlign,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(color: fg, fontWeight: FontWeight.w800)),
                    if (section.subtitle.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: Text(section.subtitle,
                            textAlign: textAlign, maxLines: 2, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: fg)),
                      ),
                    if (tappable && section.ctaText.isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: FilledButton(
                          style: FilledButton.styleFrom(backgroundColor: fg, foregroundColor: bg, visualDensity: VisualDensity.compact),
                          onPressed: open,
                          child: Text(section.ctaText),
                        ),
                      ),
                  ]),
                ),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}

/// Restaurants hand-picked in the Admin Panel, shown in the admin's order.
class PickedRestaurantsSection extends StatelessWidget {
  final WidgetSection section;
  const PickedRestaurantsSection({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    final ids = section.pickedRestaurantIds;
    if (ids.isEmpty) return const SizedBox.shrink();
    final query = RestaurantQuery(ids: ids.join(','), limit: ids.length);
    return RestaurantSection(section: section, query: query);
  }
}

/// Dishes hand-picked in the Admin Panel. Tapping a dish opens its restaurant.
class PickedDishesSection extends ConsumerWidget {
  final WidgetSection section;
  const PickedDishesSection({super.key, required this.section});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final key = section.pickedItemIds.join(',');
    if (key.isEmpty) return const SizedBox.shrink();
    final async = ref.watch(pickedDishesProvider(key));
    return async.when(
      loading: () => const SizedBox(height: 200, child: LoadingView()),
      error: (e, _) => ErrorView(error: e, onRetry: () => ref.invalidate(pickedDishesProvider(key))),
      data: (dishes) {
        if (dishes.isEmpty) return const SizedBox.shrink();
        switch (section.layout) {
          case 'carousel':
            return SizedBox(
              height: 230,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                itemCount: dishes.length,
                separatorBuilder: (_, __) => const SizedBox(width: 12),
                itemBuilder: (_, i) => SizedBox(width: 170, child: DishCard(dish: dishes[i])),
              ),
            );
          case 'grid':
            return GridView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: section.columns.clamp(1, 3), crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 0.74),
              itemCount: dishes.length,
              itemBuilder: (_, i) => DishCard(dish: dishes[i]),
            );
          default:
            return Column(children: dishes.map((d) => DishTile(dish: d)).toList());
        }
      },
    );
  }
}

void _openDish(BuildContext context, PickedDish d) {
  if (d.restaurantId.isNotEmpty) Navigator.pushNamed(context, Routes.restaurant, arguments: d.restaurantId);
}

/// Vertical dish card used by carousel and grid layouts.
class DishCard extends StatelessWidget {
  final PickedDish dish;
  const DishCard({super.key, required this.dish});

  @override
  Widget build(BuildContext context) {
    final radius = AppColors.of(context).cardRadius;
    final item = dish.item;
    final text = Theme.of(context).textTheme;
    return Semantics(
      button: true,
      label: '${item.name}, ${dish.restaurantName}',
      child: InkWell(
        borderRadius: BorderRadius.circular(radius),
        onTap: () => _openDish(context, dish),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          AspectRatio(aspectRatio: 1.25, child: NetImage(item.image, radius: radius, placeholderIcon: Icons.lunch_dining_outlined)),
          const SizedBox(height: 8),
          Row(children: [
            VegBadge(isVeg: item.isVeg, size: 14),
            const SizedBox(width: 6),
            Expanded(child: Text(item.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: text.titleSmall?.copyWith(fontWeight: FontWeight.w700))),
          ]),
          Text(dish.restaurantName, maxLines: 1, overflow: TextOverflow.ellipsis, style: text.bodySmall),
          const SizedBox(height: 4),
          _Price(item: item),
        ]),
      ),
    );
  }
}

/// Horizontal dish row used by the list layout.
class DishTile extends StatelessWidget {
  final PickedDish dish;
  const DishTile({super.key, required this.dish});

  @override
  Widget build(BuildContext context) {
    final radius = AppColors.of(context).cardRadius;
    final item = dish.item;
    final text = Theme.of(context).textTheme;
    return InkWell(
      onTap: () => _openDish(context, dish),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Row(children: [
          NetImage(item.image, width: 84, height: 84, radius: radius, placeholderIcon: Icons.lunch_dining_outlined),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                VegBadge(isVeg: item.isVeg, size: 14),
                const SizedBox(width: 6),
                Expanded(child: Text(item.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: text.titleSmall?.copyWith(fontWeight: FontWeight.w700))),
              ]),
              Text(dish.restaurantName, maxLines: 1, overflow: TextOverflow.ellipsis, style: text.bodySmall),
              if (item.description.isNotEmpty) Text(item.description, maxLines: 2, overflow: TextOverflow.ellipsis, style: text.bodySmall),
              const SizedBox(height: 4),
              _Price(item: item),
            ]),
          ),
        ]),
      ),
    );
  }
}

class _Price extends StatelessWidget {
  final MenuItem item;
  const _Price({required this.item});

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Row(children: [
      Text(Fmt.money(item.effectivePrice), style: text.titleSmall?.copyWith(fontWeight: FontWeight.w800)),
      if (item.hasDiscount) ...[
        const SizedBox(width: 6),
        Text(Fmt.money(item.price), style: text.bodySmall?.copyWith(decoration: TextDecoration.lineThrough)),
      ],
    ]);
  }
}

/// Rich text block authored in the Admin Panel (sanitized server-side).
class TextSection extends StatelessWidget {
  final WidgetSection section;
  const TextSection({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    if (section.html.isEmpty) return const SizedBox.shrink();
    final scheme = Theme.of(context).colorScheme;
    final fg = section.textColor.isNotEmpty ? hexColor(section.textColor, scheme.onSurface) : null;
    final align = switch (section.textAlign) { 'center' => TextAlign.center, 'end' => TextAlign.end, _ => TextAlign.start };
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: DefaultTextStyle.merge(
        textAlign: align,
        style: TextStyle(color: fg),
        child: HtmlWidget(
          section.html,
          textStyle: Theme.of(context).textTheme.bodyMedium?.copyWith(color: fg),
          onTapUrl: (url) {
            final uri = Uri.tryParse(url);
            if (uri == null) return false;
            launchUrl(uri, mode: LaunchMode.externalApplication);
            return true;
          },
        ),
      ),
    );
  }
}

/// Empty vertical space; height comes from section style.
class SpacerSection extends StatelessWidget {
  final WidgetSection section;
  const SpacerSection({super.key, required this.section});

  @override
  Widget build(BuildContext context) => SizedBox(height: section.height.clamp(4, 200).toDouble());
}

/// Header + body wrapper shared by custom list sections.
class TitledSection extends StatelessWidget {
  final String title;
  final String subtitle;
  final Widget child;
  const TitledSection({super.key, required this.title, required this.subtitle, required this.child});

  @override
  Widget build(BuildContext context) =>
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [SectionHeader(title: title, subtitle: subtitle), child]);
}

/// Section title, translated when the admin set a translation key.
String sectionTitle(WidgetSection s) {
  if (s.titleKey.isNotEmpty && TranslationManager.instance.has(s.titleKey)) return tr(s.titleKey);
  return s.title;
}
