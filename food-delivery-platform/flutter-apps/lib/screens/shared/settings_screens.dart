import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/env.dart';
import '../../core/routes.dart';
import '../../core/translation_manager.dart';
import '../../providers/auth_provider.dart';
import '../../providers/config_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/common/buttons.dart';
import '../../widgets/common/cards.dart';
import '../../widgets/common/inputs.dart';
import '../../widgets/common/states.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(configProvider);
    final cfg = state.config;
    final auth = ref.watch(authProvider);
    final user = auth.user;
    final b = cfg.branding;
    return Scaffold(
      appBar: AppBar(title: Text(tr('settings.title'))),
      body: ListView(children: [
        if (cfg.feature('darkModeToggle'))
          ListTile(
            leading: const Icon(Icons.dark_mode_outlined),
            title: Text(tr('settings.theme')),
            trailing: DropdownButton<ThemeMode>(
              value: state.themeMode,
              underline: const SizedBox.shrink(),
              items: ThemeMode.values.map((m) => DropdownMenuItem(value: m, child: Text(tr('settings.theme_${m.name}')))).toList(),
              onChanged: (m) => m == null ? null : ref.read(configProvider.notifier).setThemeMode(m),
            ),
          ),
        if (cfg.languages.length > 1)
          ListTile(
              leading: const Icon(Icons.translate),
              title: Text(tr('settings.language')),
              trailing: const Icon(Icons.chevron_right),
              onTap: () => Navigator.pushNamed(context, Routes.language)),
        if (user != null) ...[
          SwitchListTile(
            secondary: const Icon(Icons.notifications_active_outlined),
            title: Text(tr('settings.pushNotifications')),
            value: user.notificationPrefs['push'] ?? true,
            onChanged: (v) async => ref.read(authProvider.notifier).updateUser(await ApiService.instance.updateProfile({
                  'notificationPrefs': {...user.notificationPrefs, 'push': v}
                })),
          ),
          if (cfg.feature('emailNotifications'))
            SwitchListTile(
              secondary: const Icon(Icons.email_outlined),
              title: Text(tr('settings.emailNotifications')),
              value: user.notificationPrefs['email'] ?? true,
              onChanged: (v) async => ref.read(authProvider.notifier).updateUser(await ApiService.instance.updateProfile({
                    'notificationPrefs': {...user.notificationPrefs, 'email': v}
                  })),
            ),
          if (cfg.feature('smsNotifications'))
            SwitchListTile(
              secondary: const Icon(Icons.sms_outlined),
              title: Text(tr('settings.smsNotifications')),
              value: user.notificationPrefs['sms'] ?? true,
              onChanged: (v) async => ref.read(authProvider.notifier).updateUser(await ApiService.instance.updateProfile({
                    'notificationPrefs': {...user.notificationPrefs, 'sms': v}
                  })),
            ),
          ListTile(
              leading: const Icon(Icons.password),
              title: Text(tr('settings.changePassword')),
              onTap: () => Navigator.pushNamed(context, Routes.changePassword)),
        ],
        const Divider(),
        ...LegalPagesTiles.tiles(context),
        if (b.supportPhone.isNotEmpty)
          ListTile(
              leading: const Icon(Icons.call_outlined),
              title: Text(tr('support.call')),
              subtitle: Text(b.supportPhone),
              onTap: () => launchUrl(Uri.parse('tel:${b.supportPhone}'))),
        if (b.supportEmail.isNotEmpty)
          ListTile(
              leading: const Icon(Icons.mail_outline),
              title: Text(tr('support.email')),
              subtitle: Text(b.supportEmail),
              onTap: () => launchUrl(Uri.parse('mailto:${b.supportEmail}'))),
        if (b.whatsappNumber.isNotEmpty)
          ListTile(
            leading: const Icon(Icons.chat_outlined),
            title: Text(tr('support.whatsapp')),
            onTap: () => launchUrl(Uri.parse('https://wa.me/${b.whatsappNumber.replaceAll(RegExp(r'[^0-9]'), '')}'), mode: LaunchMode.externalApplication),
          ),
        if (b.socialLinks.values.any((v) => v.isNotEmpty))
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: Wrap(
              children: b.socialLinks.entries
                  .where((e) => e.value.isNotEmpty)
                  .map((e) =>
                      TextButton(onPressed: () => launchUrl(Uri.parse(e.value), mode: LaunchMode.externalApplication), child: Text(tr('social.${e.key}'))))
                  .toList(),
            ),
          ),
        const Divider(),
        if (user != null)
          ListTile(
            leading: Icon(Icons.logout, color: Theme.of(context).colorScheme.error),
            title: Text(tr('auth.logout'), style: TextStyle(color: Theme.of(context).colorScheme.error)),
            onTap: () async {
              if (!await confirmDialog(context, titleKey: 'auth.logoutConfirm')) return;
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) Navigator.of(context).pushNamedAndRemoveUntil(Routes.login, (_) => false);
            },
          ),
        if (user != null)
          ListTile(
            leading: Icon(Icons.delete_forever_outlined, color: Theme.of(context).colorScheme.error),
            title: Text(tr('settings.deleteAccount'), style: TextStyle(color: Theme.of(context).colorScheme.error)),
            onTap: () async {
              if (!await confirmDialog(context, titleKey: 'settings.deleteAccount', messageKey: 'settings.deleteAccountMessage', confirmKey: 'common.delete')) return;
              try {
                await ApiService.instance.deleteAccount();
                await ref.read(authProvider.notifier).logout();
                if (context.mounted) Navigator.of(context).pushNamedAndRemoveUntil(Routes.login, (_) => false);
              } catch (e) {
                if (context.mounted) showError(context, e);
              }
            },
          ),
        FutureBuilder<PackageInfo>(
          future: PackageInfo.fromPlatform(),
          builder: (_, snap) => Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              [
                tr('settings.version', {'version': snap.data?.version ?? ''}),
                if (b.copyright.isNotEmpty) b.copyright
              ].join('\n'),
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
        ),
      ]),
    );
  }
}

class LegalPagesTiles {
  static List<Widget> tiles(BuildContext context) => [
        for (final e in const {
          'aboutUs': Icons.info_outline,
          'termsAndConditions': Icons.gavel_outlined,
          'privacyPolicy': Icons.privacy_tip_outlined,
          'refundPolicy': Icons.currency_exchange,
        }.entries)
          if (Env.flavor == AppFlavor.customer || e.key != 'refundPolicy')
            ListTile(leading: Icon(e.value), title: Text(tr(_titleFor(e.key))), onTap: () => Navigator.pushNamed(context, Routes.legal, arguments: e.key)),
      ];

  static String _titleFor(String k) => switch (k) {
        'aboutUs' => 'legal.about',
        'termsAndConditions' => 'legal.terms',
        'privacyPolicy' => 'legal.privacy',
        _ => 'legal.refund',
      };
}

class LanguageScreen extends ConsumerWidget {
  const LanguageScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(configProvider);
    final meta = {for (final m in state.config.languageMeta) m.code: m};
    return Scaffold(
      appBar: AppBar(title: Text(tr('settings.language'))),
      body: RadioGroup<String>(
        groupValue: state.language,
        onChanged: (v) async {
          if (v == null) return;
          await ref.read(configProvider.notifier).setLanguage(v);
          if (ref.read(authProvider).isLoggedIn) ApiService.instance.updateProfile({'language': v}).catchError((_) => <String, dynamic>{});
        },
        child: ListView(
          children: state.config.languages.map((code) {
            final m = meta[code];
            return RadioListTile<String>(
              value: code,
              title: Text(m?.nativeName.isNotEmpty == true ? m!.nativeName : (m?.name ?? code.toUpperCase())),
              subtitle: m == null ? null : Text(m.name),
            );
          }).toList(),
        ),
      ),
    );
  }
}

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});
  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  late final TextEditingController _name;
  late final TextEditingController _email;
  late final TextEditingController _phone;
  String _avatar = '';
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final u = ref.read(authProvider).user;
    _name = TextEditingController(text: u?.name);
    _email = TextEditingController(text: u?.email);
    _phone = TextEditingController(text: u?.phone);
    _avatar = u?.avatar ?? '';
  }

  Future<void> _pick() async {
    final f = await ImagePicker().pickImage(source: ImageSource.gallery, maxWidth: 800);
    if (f == null) return;
    try {
      final url = await ApiService.instance.upload(f.path, folder: 'avatars');
      setState(() => _avatar = url);
    } catch (e) {
      if (mounted) showError(context, e);
    }
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      final u =
          await ApiService.instance.updateProfile({'name': _name.text.trim(), 'email': _email.text.trim(), 'phone': _phone.text.trim(), 'avatar': _avatar});
      ref.read(authProvider.notifier).updateUser(u);
      if (mounted) {
        showMessage(context, 'profile.updated');
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(tr('profile.edit'))),
        body: ListView(padding: const EdgeInsets.all(20), children: [
          Center(
            child: GestureDetector(
              onTap: _pick,
              child: Stack(children: [
                ClipOval(child: NetImage(_avatar, width: 96, height: 96, placeholderIcon: Icons.person)),
                Positioned(right: 0, bottom: 0, child: CircleAvatar(radius: 16, child: const Icon(Icons.edit, size: 16))),
              ]),
            ),
          ),
          const SizedBox(height: 24),
          AppInput(controller: _name, labelKey: 'auth.name', icon: Icons.person_outline),
          AppInput(controller: _email, labelKey: 'auth.email', icon: Icons.email_outlined),
          AppInput(controller: _phone, labelKey: 'auth.phone', icon: Icons.phone),
          AppButton(labelKey: 'common.save', loading: _saving, onPressed: _save),
        ]),
      );
}

class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});
  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _current = TextEditingController();
  final _next = TextEditingController();
  final _form = GlobalKey<FormState>();
  bool _saving = false;

  Future<void> _save() async {
    if (!_form.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await ApiService.instance.changePassword(_current.text, _next.text);
      if (mounted) {
        showMessage(context, 'auth.passwordChanged');
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(tr('settings.changePassword'))),
        body: Form(
          key: _form,
          child: ListView(padding: const EdgeInsets.all(20), children: [
            AppInput(controller: _current, labelKey: 'auth.currentPassword', obscure: true, icon: Icons.lock_outline),
            AppInput(controller: _next, labelKey: 'auth.newPassword', obscure: true, icon: Icons.lock_reset, validator: Validators.password),
            AppButton(labelKey: 'common.save', loading: _saving, onPressed: _save),
          ]),
        ),
      );
}
