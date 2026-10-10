import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_widget_from_html_core/flutter_widget_from_html_core.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/translation_manager.dart';
import '../../providers/config_provider.dart';
import '../../widgets/common/states.dart';

/// Renders rich-text legal pages edited in Admin → Legal Pages.
class LegalScreen extends ConsumerWidget {
  final String page; // privacyPolicy | termsAndConditions | refundPolicy | aboutUs
  const LegalScreen({super.key, required this.page});

  static const titles = {
    'privacyPolicy': 'legal.privacy',
    'termsAndConditions': 'legal.terms',
    'refundPolicy': 'legal.refund',
    'aboutUs': 'legal.about',
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final html = ref.watch(appConfigProvider).legal[page] ?? '';
    return Scaffold(
      appBar: AppBar(title: Text(tr(titles[page] ?? 'legal.title'))),
      body: html.isEmpty
          ? const EmptyState(icon: Icons.description_outlined, titleKey: 'legal.empty')
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: HtmlWidget(
                html,
                onTapUrl: (url) => launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication),
              ),
            ),
    );
  }
}
