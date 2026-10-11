import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/formatters.dart';
import '../../core/translation_manager.dart';
import '../../models/app_notification.dart';
import '../../models/json_utils.dart';
import '../../services/api_service.dart';
import '../../widgets/common/cards.dart';
import '../../widgets/common/states.dart';

final notificationsProvider = FutureProvider.autoDispose<List<AppNotification>>((ref) async {
  final data = await ApiService.instance.notifications();
  return toList(data['items']).map((e) => AppNotification.fromJson(toMap(e))).toList();
});

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});
  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    ApiService.instance.markNotificationsRead().catchError((_) {});
  }

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(notificationsProvider);
    return Scaffold(
      appBar: AppBar(title: Text(tr('notifications.title'))),
      body: async.when(
        loading: () => const LoadingView(),
        error: (e, _) => ErrorView(error: e, onRetry: () => ref.invalidate(notificationsProvider)),
        data: (list) => list.isEmpty
            ? const EmptyState(icon: Icons.notifications_none, titleKey: 'notifications.empty')
            : RefreshIndicator(
                onRefresh: () async => ref.invalidate(notificationsProvider),
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: list.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (_, i) {
                    final n = list[i];
                    return AppCard(
                      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        if (n.imageUrl.isNotEmpty) ...[
                          NetImage(n.imageUrl, width: 52, height: 52, radius: 8),
                          const SizedBox(width: 12)
                        ] else ...[
                          Icon(n.type == 'order' ? Icons.receipt_long : Icons.campaign_outlined, color: Theme.of(context).colorScheme.primary),
                          const SizedBox(width: 12)
                        ],
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(n.title, style: TextStyle(fontWeight: n.isRead ? FontWeight.w500 : FontWeight.w800)),
                            if (n.body.isNotEmpty) Text(n.body),
                            const SizedBox(height: 4),
                            Text(Fmt.dateTime(n.createdAt), style: Theme.of(context).textTheme.bodySmall),
                          ]),
                        ),
                      ]),
                    );
                  },
                ),
              ),
      ),
    );
  }
}
