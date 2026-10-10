import 'package:flutter/material.dart';

import '../../core/translation_manager.dart';

class AppInput extends StatelessWidget {
  final TextEditingController controller;
  final String labelKey;
  final String? hintKey;
  final IconData? icon;
  final bool obscure;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;
  final int maxLines;
  final Widget? suffix;
  final ValueChanged<String>? onChanged;
  final bool enabled;

  const AppInput({
    super.key,
    required this.controller,
    required this.labelKey,
    this.hintKey,
    this.icon,
    this.obscure = false,
    this.keyboardType,
    this.validator,
    this.maxLines = 1,
    this.suffix,
    this.onChanged,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: TextFormField(
          controller: controller,
          obscureText: obscure,
          keyboardType: keyboardType,
          validator: validator,
          maxLines: maxLines,
          onChanged: onChanged,
          enabled: enabled,
          decoration: InputDecoration(
            labelText: tr(labelKey),
            hintText: hintKey == null ? null : tr(hintKey!),
            prefixIcon: icon == null ? null : Icon(icon),
            suffixIcon: suffix,
          ),
        ),
      );
}

/// Validators returning translated messages.
class Validators {
  static String? required(String? v) => (v == null || v.trim().isEmpty) ? tr('validation.required') : null;
  static String? email(String? v) {
    if (v == null || v.isEmpty) return null;
    return RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(v.trim()) ? null : tr('validation.emailInvalid');
  }

  static String? password(String? v) => (v == null || v.length < 6) ? tr('validation.passwordMin') : null;
  static String? phone(String? v) => (v == null || v.trim().length < 7) ? tr('validation.phoneInvalid') : null;
  static String? number(String? v) => (v == null || double.tryParse(v.trim()) == null) ? tr('validation.number') : null;
}

class SearchField extends StatelessWidget {
  final TextEditingController? controller;
  final String hintKey;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final VoidCallback? onTap;
  final bool readOnly;
  final bool autofocus;
  const SearchField(
      {super.key, this.controller, required this.hintKey, this.onChanged, this.onSubmitted, this.onTap, this.readOnly = false, this.autofocus = false});

  @override
  Widget build(BuildContext context) => TextField(
        controller: controller,
        readOnly: readOnly,
        autofocus: autofocus,
        onTap: onTap,
        onChanged: onChanged,
        onSubmitted: onSubmitted,
        textInputAction: TextInputAction.search,
        decoration: InputDecoration(prefixIcon: const Icon(Icons.search), hintText: tr(hintKey)),
      );
}
