import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/formatters.dart';
import '../../core/routes.dart';
import '../../core/translation_manager.dart';
import '../../providers/auth_provider.dart';
import '../../providers/config_provider.dart';
import '../../widgets/common/cards.dart';

/// Profile hub. Every entry is shown/hidden by feature flags.
class ProfileTab extends ConsumerWidget {
  const ProfileTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final cfg = ref.watch(appConfigProvider);
    Widget tile(IconData icon, String key, String route, {Object? args, String? trailing}) => ListTile(
          leading: Icon(icon),
          title: Text(tr(key)),
          trailing: trailing == null ? const Icon(Icons.chevron_right) : Text(trailing, style: const TextStyle(fontWeight: FontWeight.w700)),
          onTap: () => Navigator.pushNamed(context, route, arguments: args),
        );
    return SafeArea(
      child: ListView(children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(children: [
            ClipOval(child: NetImage(user?.avatar ?? '', width: 64, height: 64, placeholderIcon: Icons.person)),
            const SizedBox(width: 14),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(user?.name.isNotEmpty == true ? user!.name : tr('profile.guest'),
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
                if (user?.phone.isNotEmpty == true) Text(user!.phone),
                if (user?.email.isNotEmpty == true) Text(user!.email, style: Theme.of(context).textTheme.bodySmall),
              ]),
            ),
            IconButton(icon: const Icon(Icons.edit_outlined), onPressed: () => Navigator.pushNamed(context, Routes.editProfile)),
          ]),
        ),
        const Divider(),
        tile(Icons.location_on_outlined, 'profile.addresses', Routes.addresses),
        if (cfg.feature('favorites')) tile(Icons.favorite_border, 'profile.favorites', Routes.favorites),
        if (cfg.feature('wallet')) tile(Icons.account_balance_wallet_outlined, 'profile.wallet', Routes.wallet, trailing: Fmt.money(user?.walletBalance ?? 0)),
        if (cfg.feature('referral')) tile(Icons.card_giftcard, 'profile.referral', Routes.referral),
        if (cfg.feature('coupons')) tile(Icons.local_offer_outlined, 'profile.offers', Routes.offers),
        tile(Icons.notifications_none, 'notifications.title', Routes.notifications),
        tile(Icons.settings_outlined, 'settings.title', Routes.settings),
      ]),
    );
  }
}
