import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/env.dart';
import '../../core/routes.dart';
import '../../core/translation_manager.dart';
import '../../models/json_utils.dart';
import '../../providers/auth_provider.dart';
import '../../providers/config_provider.dart';
import '../../services/auth_service.dart';
import '../../widgets/common/buttons.dart';
import '../../widgets/common/cards.dart';
import '../../widgets/common/inputs.dart';
import '../../widgets/common/states.dart';

String _appName(WidgetRef ref) {
  final b = ref.watch(appConfigProvider).branding;
  return switch (Env.flavor) { AppFlavor.customer => b.appName, AppFlavor.vendor => b.vendorAppName, AppFlavor.delivery => b.deliveryAppName };
}

class _AuthHeader extends ConsumerWidget {
  final String titleKey;
  final String subtitleKey;
  const _AuthHeader({required this.titleKey, required this.subtitleKey});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cfg = ref.watch(appConfigProvider);
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      if (cfg.theme.appIconUrl.isNotEmpty) NetImage(cfg.theme.appIconUrl, width: 64, height: 64, radius: 16),
      const SizedBox(height: 20),
      Text(tr(titleKey, {'app': _appName(ref)}), style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
      const SizedBox(height: 6),
      Text(tr(subtitleKey, {'app': _appName(ref)}), style: Theme.of(context).textTheme.bodyMedium),
      const SizedBox(height: 28),
    ]);
  }
}

Future<void> _afterAuth(BuildContext context, WidgetRef ref, AuthResult r) async {
  await ref.read(authProvider.notifier).handleResult(r);
  if (context.mounted) Navigator.of(context).pushNamedAndRemoveUntil(Routes.homeForFlavor, (_) => false);
}

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});
  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _form = GlobalKey<FormState>();
  final _id = TextEditingController();
  final _password = TextEditingController();
  final _phone = TextEditingController();
  bool _otpMode = false;
  bool _loading = false;
  bool _obscure = true;

  Future<void> _run(Future<void> Function() fn) async {
    setState(() => _loading = true);
    try {
      await fn();
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _passwordLogin() {
    if (!_form.currentState!.validate()) return;
    _run(() async => _afterAuth(context, ref, await ref.read(authProvider.notifier).service.login(_id.text.trim(), _password.text)));
  }

  void _sendOtp() {
    if (Validators.phone(_phone.text) != null) {
      showMessage(context, 'validation.phoneInvalid');
      return;
    }
    _run(() async {
      final res = await ref.read(authProvider.notifier).service.sendOtp(_phone.text.trim());
      if (!mounted) return;
      if (res['devOtp'] != null) showMessage(context, 'auth.devOtp', {'otp': res['devOtp']});
      Navigator.pushNamed(context, Routes.otp, arguments: _phone.text.trim());
    });
  }

  void _social(Future<AuthResult?> Function() fn) => _run(() async {
        final r = await fn();
        if (r != null && mounted) await _afterAuth(context, ref, r);
      });

  @override
  Widget build(BuildContext context) {
    final cfg = ref.watch(appConfigProvider);
    final otpAllowed = cfg.feature('otpLogin') && cfg.businessRules.otpLogin;
    final service = ref.read(authProvider.notifier).service;
    final showGoogle = cfg.feature('googleSignIn');
    final showApple = cfg.feature('appleSignIn') && !kIsWeb && defaultTargetPlatform == TargetPlatform.iOS;
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _form,
            child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
              const SizedBox(height: 24),
              _AuthHeader(titleKey: 'auth.welcome', subtitleKey: 'auth.loginSubtitle.${Env.flavor.name}'),
              if (otpAllowed)
                SegmentedButton<bool>(
                  segments: [
                    ButtonSegment(value: false, label: Text(tr('auth.password'))),
                    ButtonSegment(value: true, label: Text(tr('auth.otp'))),
                  ],
                  selected: {_otpMode},
                  onSelectionChanged: (s) => setState(() => _otpMode = s.first),
                ),
              const SizedBox(height: 20),
              if (_otpMode && otpAllowed) ...[
                AppInput(controller: _phone, labelKey: 'auth.phone', icon: Icons.phone, keyboardType: TextInputType.phone),
                AppButton(labelKey: 'auth.sendOtp', loading: _loading, onPressed: _sendOtp),
              ] else ...[
                AppInput(controller: _id, labelKey: 'auth.emailOrPhone', icon: Icons.person_outline, validator: Validators.required),
                AppInput(
                  controller: _password,
                  labelKey: 'auth.password',
                  icon: Icons.lock_outline,
                  obscure: _obscure,
                  validator: Validators.required,
                  suffix: IconButton(icon: Icon(_obscure ? Icons.visibility : Icons.visibility_off), onPressed: () => setState(() => _obscure = !_obscure)),
                ),
                Align(
                    alignment: AlignmentDirectional.centerEnd,
                    child: TextButton(onPressed: () => Navigator.pushNamed(context, Routes.forgotPassword), child: Text(tr('auth.forgotPassword')))),
                AppButton(labelKey: 'auth.login', loading: _loading, onPressed: _passwordLogin),
              ],
              if (showGoogle || showApple) ...[
                const SizedBox(height: 24),
                Row(children: [
                  const Expanded(child: Divider()),
                  Padding(padding: const EdgeInsets.symmetric(horizontal: 12), child: Text(tr('auth.or'))),
                  const Expanded(child: Divider())
                ]),
                const SizedBox(height: 16),
                if (showGoogle)
                  AppButton(
                      labelKey: 'auth.continueGoogle',
                      icon: Icons.g_mobiledata,
                      outlined: true,
                      onPressed: _loading ? null : () => _social(service.googleSignIn)),
                if (showGoogle && showApple) const SizedBox(height: 10),
                if (showApple)
                  AppButton(labelKey: 'auth.continueApple', icon: Icons.apple, outlined: true, onPressed: _loading ? null : () => _social(service.appleSignIn)),
              ],
              const SizedBox(height: 24),
              Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                Text(tr('auth.noAccount')),
                TextButton(onPressed: () => Navigator.pushNamed(context, Routes.register), child: Text(tr('auth.signUp'))),
              ]),
              Wrap(alignment: WrapAlignment.center, children: [
                TextButton(onPressed: () => Navigator.pushNamed(context, Routes.legal, arguments: 'termsAndConditions'), child: Text(tr('legal.terms'))),
                TextButton(onPressed: () => Navigator.pushNamed(context, Routes.legal, arguments: 'privacyPolicy'), child: Text(tr('legal.privacy'))),
              ]),
            ]),
          ),
        ),
      ),
    );
  }
}

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});
  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _form = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _referral = TextEditingController();
  bool _loading = false;

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    if (_email.text.trim().isEmpty && _phone.text.trim().isEmpty) {
      showMessage(context, 'validation.emailOrPhone');
      return;
    }
    setState(() => _loading = true);
    try {
      final r = await ref.read(authProvider.notifier).service.register(
            name: _name.text.trim(),
            email: _email.text.trim(),
            phone: _phone.text.trim(),
            password: _password.text,
            referralCode: _referral.text.trim(),
            language: ref.read(configProvider).language,
          );
      if (mounted) await _afterAuth(context, ref, r);
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final referral = ref.watch(featureProvider('referral')) && Env.flavor == AppFlavor.customer;
    return Scaffold(
      appBar: AppBar(),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _form,
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            _AuthHeader(titleKey: 'auth.createAccount', subtitleKey: 'auth.registerSubtitle'),
            AppInput(controller: _name, labelKey: 'auth.name', icon: Icons.person_outline, validator: Validators.required),
            AppInput(
                controller: _email, labelKey: 'auth.email', icon: Icons.email_outlined, keyboardType: TextInputType.emailAddress, validator: Validators.email),
            AppInput(controller: _phone, labelKey: 'auth.phone', icon: Icons.phone, keyboardType: TextInputType.phone),
            AppInput(controller: _password, labelKey: 'auth.password', icon: Icons.lock_outline, obscure: true, validator: Validators.password),
            if (referral) AppInput(controller: _referral, labelKey: 'auth.referralCode', icon: Icons.card_giftcard),
            const SizedBox(height: 8),
            AppButton(labelKey: 'auth.signUp', loading: _loading, onPressed: _submit),
          ]),
        ),
      ),
    );
  }
}

class OtpScreen extends ConsumerStatefulWidget {
  final String phone;
  const OtpScreen({super.key, required this.phone});
  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  final _otp = TextEditingController();
  final _name = TextEditingController();
  final _referral = TextEditingController();
  bool _loading = false;

  Future<void> _verify() async {
    setState(() => _loading = true);
    try {
      final r = await ref
          .read(authProvider.notifier)
          .service
          .verifyOtp(widget.phone, _otp.text.trim(), name: _name.text.trim().isEmpty ? null : _name.text.trim(), referralCode: _referral.text.trim());
      if (mounted) await _afterAuth(context, ref, r);
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _resend() async {
    try {
      final res = await ref.read(authProvider.notifier).service.sendOtp(widget.phone);
      if (!mounted) return;
      showMessage(context, res['devOtp'] != null ? 'auth.devOtp' : 'auth.otpSent', {'otp': toStr(res['devOtp'])});
    } catch (e) {
      if (mounted) showError(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final length = ref.watch(businessRulesProvider).otpLength;
    final referral = ref.watch(featureProvider('referral')) && Env.flavor == AppFlavor.customer;
    return Scaffold(
      appBar: AppBar(),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          Text(tr('auth.verifyOtp'), style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          Text(tr('auth.otpSentTo', {'phone': widget.phone})),
          const SizedBox(height: 24),
          TextField(
            controller: _otp,
            keyboardType: TextInputType.number,
            maxLength: length,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(letterSpacing: 12),
            decoration: InputDecoration(counterText: '', labelText: tr('auth.otp')),
          ),
          const SizedBox(height: 14),
          AppInput(controller: _name, labelKey: 'auth.nameIfNew', icon: Icons.person_outline),
          if (referral) AppInput(controller: _referral, labelKey: 'auth.referralCode', icon: Icons.card_giftcard),
          AppButton(labelKey: 'auth.verify', loading: _loading, onPressed: _verify),
          TextButton(onPressed: _resend, child: Text(tr('auth.resendOtp'))),
        ]),
      ),
    );
  }
}

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});
  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _id = TextEditingController();
  final _code = TextEditingController();
  final _password = TextEditingController();
  bool _sent = false;
  bool _loading = false;

  Future<void> _go() async {
    setState(() => _loading = true);
    final service = ref.read(authProvider.notifier).service;
    try {
      if (!_sent) {
        final res = await service.forgotPassword(_id.text.trim());
        setState(() => _sent = true);
        if (mounted) showMessage(context, res['devCode'] != null ? 'auth.devOtp' : 'auth.resetSent', {'otp': toStr(res['devCode'])});
      } else {
        if (Validators.password(_password.text) != null) {
          showMessage(context, 'validation.passwordMin');
          return;
        }
        await service.resetPassword(_id.text.trim(), _code.text.trim(), _password.text);
        if (!mounted) return;
        showMessage(context, 'auth.passwordReset');
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) showError(context, e);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: Text(tr('auth.forgotPassword'))),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            Text(tr(_sent ? 'auth.enterResetCode' : 'auth.forgotSubtitle')),
            const SizedBox(height: 20),
            AppInput(controller: _id, labelKey: 'auth.emailOrPhone', icon: Icons.person_outline, enabled: !_sent),
            if (_sent) ...[
              AppInput(controller: _code, labelKey: 'auth.resetCode', icon: Icons.pin, keyboardType: TextInputType.number),
              AppInput(controller: _password, labelKey: 'auth.newPassword', icon: Icons.lock_outline, obscure: true),
            ],
            AppButton(labelKey: _sent ? 'auth.resetPassword' : 'auth.sendCode', loading: _loading, onPressed: _go),
          ]),
        ),
      );
}
