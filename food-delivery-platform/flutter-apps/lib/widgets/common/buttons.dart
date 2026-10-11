import 'package:flutter/material.dart';

import '../../core/translation_manager.dart';

/// Primary/secondary buttons — shape & colors come from DynamicTheme (config.theme).
class AppButton extends StatelessWidget {
  final String labelKey;
  final Map<String, Object?> vars;
  final VoidCallback? onPressed;
  final bool loading;
  final bool outlined;
  final IconData? icon;

  const AppButton({super.key, required this.labelKey, this.vars = const {}, this.onPressed, this.loading = false, this.outlined = false, this.icon});

  @override
  Widget build(BuildContext context) {
    final child = loading
        ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2.4))
        : Row(mainAxisSize: MainAxisSize.min, children: [
            if (icon != null) ...[Icon(icon, size: 20), const SizedBox(width: 8)],
            Flexible(child: Text(tr(labelKey, vars), overflow: TextOverflow.ellipsis)),
          ]);
    final action = loading ? null : onPressed;
    return outlined ? OutlinedButton(onPressed: action, child: child) : ElevatedButton(onPressed: action, child: child);
  }
}

class QuantityStepper extends StatelessWidget {
  final int quantity;
  final VoidCallback onAdd;
  final VoidCallback onRemove;
  final bool compact;
  const QuantityStepper({super.key, required this.quantity, required this.onAdd, required this.onRemove, this.compact = false});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    if (quantity == 0) {
      return OutlinedButton(
        style: OutlinedButton.styleFrom(minimumSize: Size(compact ? 72 : 96, compact ? 32 : 38), padding: const EdgeInsets.symmetric(horizontal: 12)),
        onPressed: onAdd,
        child: Text(tr('common.add')),
      );
    }
    return Container(
      height: compact ? 32 : 38,
      decoration: BoxDecoration(color: scheme.primary, borderRadius: BorderRadius.circular(8)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        IconButton(visualDensity: VisualDensity.compact, icon: Icon(Icons.remove, color: scheme.onPrimary, size: 18), onPressed: onRemove),
        Text('$quantity', style: TextStyle(color: scheme.onPrimary, fontWeight: FontWeight.bold)),
        IconButton(visualDensity: VisualDensity.compact, icon: Icon(Icons.add, color: scheme.onPrimary, size: 18), onPressed: onAdd),
      ]),
    );
  }
}
