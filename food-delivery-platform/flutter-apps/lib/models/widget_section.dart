import 'json_utils.dart';

/// One entry of `homeLayout` — the home screen is rendered by iterating these.
class WidgetSection {
  final String id;
  final String type;
  final bool enabled;
  final int order;
  final String title;
  final String titleKey;
  final String subtitle;
  final String layout; // grid | list | carousel
  final int columns;
  final int limit;
  final Map<String, dynamic> filter;
  final Map<String, dynamic> style;

  const WidgetSection({
    required this.id,
    required this.type,
    required this.enabled,
    required this.order,
    required this.title,
    required this.titleKey,
    required this.subtitle,
    required this.layout,
    required this.columns,
    required this.limit,
    required this.filter,
    required this.style,
  });

  factory WidgetSection.fromJson(Map<String, dynamic> j) => WidgetSection(
        id: toStr(j['id'], toStr(j['type'])),
        type: toStr(j['type']),
        enabled: toBool(j['enabled'], true),
        order: toInt(j['order']),
        title: toStr(j['title']),
        titleKey: toStr(j['titleKey']),
        subtitle: toStr(j['subtitle']),
        layout: toStr(j['layout'], 'list'),
        columns: toInt(j['columns'], 2),
        limit: toInt(j['limit'], 10),
        filter: toMap(j['filter']),
        style: toMap(j['style']),
      );
}
