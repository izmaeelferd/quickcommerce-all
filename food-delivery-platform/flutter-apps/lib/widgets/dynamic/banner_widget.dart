import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/dynamic_theme.dart';
import '../../models/banner.dart';
import '../../models/widget_section.dart';
import '../../providers/config_provider.dart';
import '../common/cards.dart';
import 'section_link.dart';

/// Auto-playing banner carousel; banners, order and schedule are managed in Admin → Banner Manager.
class BannerWidget extends ConsumerStatefulWidget {
  final WidgetSection section;
  const BannerWidget({super.key, required this.section});

  @override
  ConsumerState<BannerWidget> createState() => _BannerWidgetState();
}

class _BannerWidgetState extends ConsumerState<BannerWidget> {
  final _controller = PageController(viewportFraction: 0.92);
  Timer? _timer;
  int _page = 0;

  @override
  void initState() {
    super.initState();
    final seconds = (widget.section.style['autoplaySeconds'] as num?)?.toInt() ?? 4;
    _timer = Timer.periodic(Duration(seconds: seconds), (_) {
      final count = _banners.length;
      if (count < 2 || !_controller.hasClients) return;
      _controller.animateToPage((_page + 1) % count, duration: const Duration(milliseconds: 400), curve: Curves.easeOut);
    });
  }

  List<BannerModel> get _banners {
    final placement = (widget.section.filter['placement'] as String?) ?? 'home';
    return ref.read(appConfigProvider).banners.where((b) => b.placement == placement).toList();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  Future<void> _open(BannerModel b) async {
    ref.read(configProvider.notifier).trackBanner(b.id);
    await openSectionLink(context, b.linkType, b.linkValue, title: b.title);
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(appConfigProvider);
    final banners = _banners;
    if (banners.isEmpty) return const SizedBox.shrink();
    final height = (widget.section.style['height'] as num?)?.toDouble() ?? 160;
    final radius = AppColors.of(context).cardRadius;
    final scheme = Theme.of(context).colorScheme;
    return Column(children: [
      const SizedBox(height: 12),
      SizedBox(
        height: height,
        child: PageView.builder(
          controller: _controller,
          itemCount: banners.length,
          onPageChanged: (i) => setState(() => _page = i),
          itemBuilder: (_, i) {
            final b = banners[i];
            return GestureDetector(
              onTap: () => _open(b),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(radius),
                  child: Stack(fit: StackFit.expand, children: [
                    Container(color: hexColor(b.backgroundColor, scheme.primaryContainer)),
                    NetImage(b.imageUrl, placeholderIcon: Icons.local_offer),
                    if (b.title.isNotEmpty)
                      Positioned(
                        left: 16,
                        bottom: 14,
                        right: 16,
                        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                          Text(b.title,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleLarge
                                  ?.copyWith(color: scheme.onPrimary, fontWeight: FontWeight.bold, shadows: const [Shadow(blurRadius: 6)])),
                          if (b.subtitle.isNotEmpty) Text(b.subtitle, style: TextStyle(color: scheme.onPrimary, shadows: const [Shadow(blurRadius: 6)])),
                        ]),
                      ),
                  ]),
                ),
              ),
            );
          },
        ),
      ),
      const SizedBox(height: 8),
      Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: List.generate(
          banners.length,
          (i) => AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            margin: const EdgeInsets.symmetric(horizontal: 3),
            width: i == _page ? 18 : 6,
            height: 6,
            decoration: BoxDecoration(color: i == _page ? scheme.primary : scheme.outlineVariant, borderRadius: BorderRadius.circular(3)),
          ),
        ),
      ),
    ]);
  }
}
