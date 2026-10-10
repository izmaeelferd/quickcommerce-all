import 'package:flutter/material.dart';

import '../../core/api_client.dart';
import '../../core/translation_manager.dart';

class LoadingView extends StatelessWidget {
  const LoadingView({super.key});
  @override
  Widget build(BuildContext context) => const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()));
}

class EmptyState extends StatelessWidget {
  final IconData icon;
  final String titleKey;
  final String? messageKey;
  final String? actionKey;
  final VoidCallback? onAction;
  const EmptyState({super.key, required this.icon, required this.titleKey, this.messageKey, this.actionKey, this.onAction});

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(icon, size: 72, color: Theme.of(context).colorScheme.outline),
            const SizedBox(height: 16),
            Text(tr(titleKey), textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleMedium),
            if (messageKey != null) ...[
              const SizedBox(height: 6),
              Text(tr(messageKey!), textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyMedium)
            ],
            if (actionKey != null && onAction != null) ...[const SizedBox(height: 20), OutlinedButton(onPressed: onAction, child: Text(tr(actionKey!)))],
          ]),
        ),
      );
}

class ErrorView extends StatelessWidget {
  final Object error;
  final VoidCallback? onRetry;
  const ErrorView({super.key, required this.error, this.onRetry});

  @override
  Widget build(BuildContext context) => EmptyState(
        icon: Icons.cloud_off,
        titleKey: errorKey(error),
        actionKey: onRetry == null ? null : 'common.retry',
        onAction: onRetry,
      );
}

/// Maps any thrown error to a translation key (backend returns keys as messages).
String errorKey(Object e) {
  if (e is ApiException) return e.messageKey;
  return 'error.generic';
}

void showError(BuildContext context, Object e) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(tr(errorKey(e))), backgroundColor: Theme.of(context).colorScheme.error));
}

void showMessage(BuildContext context, String key, [Map<String, Object?> vars = const {}]) {
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(tr(key, vars))));
}

Future<bool> confirmDialog(BuildContext context, {required String titleKey, String? messageKey, String confirmKey = 'common.confirm'}) async {
  final r = await showDialog<bool>(
    context: context,
    builder: (c) => AlertDialog(
      title: Text(tr(titleKey)),
      content: messageKey == null ? null : Text(tr(messageKey)),
      actions: [
        TextButton(onPressed: () => Navigator.pop(c, false), child: Text(tr('common.cancel'))),
        FilledButton(onPressed: () => Navigator.pop(c, true), child: Text(tr(confirmKey))),
      ],
    ),
  );
  return r ?? false;
}

Future<String?> promptDialog(BuildContext context, {required String titleKey, required String labelKey, String initial = ''}) async {
  final ctrl = TextEditingController(text: initial);
  final r = await showDialog<String>(
    context: context,
    builder: (c) => AlertDialog(
      title: Text(tr(titleKey)),
      content: TextField(controller: ctrl, autofocus: true, decoration: InputDecoration(labelText: tr(labelKey))),
      actions: [
        TextButton(onPressed: () => Navigator.pop(c), child: Text(tr('common.cancel'))),
        FilledButton(onPressed: () => Navigator.pop(c, ctrl.text.trim()), child: Text(tr('common.save'))),
      ],
    ),
  );
  return r;
}
