import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/routes.dart';

/// Opens a link configured in the Admin Panel (banners, promo sections).
/// Link types: none | restaurant | category | cuisine | coupon | offers | url.
Future<void> openSectionLink(BuildContext context, String linkType, String linkValue, {String title = ''}) async {
  switch (linkType) {
    case 'restaurant':
      if (linkValue.isNotEmpty) await Navigator.pushNamed(context, Routes.restaurant, arguments: linkValue);
    case 'category':
      if (linkValue.isNotEmpty) await Navigator.pushNamed(context, Routes.search, arguments: {'category': linkValue, 'title': title});
    case 'cuisine':
      if (linkValue.isNotEmpty) await Navigator.pushNamed(context, Routes.search, arguments: {'cuisine': linkValue, 'title': title});
    case 'coupon':
    case 'offers':
      await Navigator.pushNamed(context, Routes.offers);
    case 'url':
      final uri = Uri.tryParse(linkValue);
      if (uri != null && (uri.scheme == 'https' || uri.scheme == 'http')) await launchUrl(uri, mode: LaunchMode.externalApplication);
  }
}
