/// Defensive JSON helpers so that partially-configured backends never crash the UI.
double toDouble(dynamic v, [double fallback = 0]) {
  if (v == null) return fallback;
  if (v is num) return v.toDouble();
  return double.tryParse(v.toString()) ?? fallback;
}

int toInt(dynamic v, [int fallback = 0]) {
  if (v == null) return fallback;
  if (v is num) return v.toInt();
  return int.tryParse(v.toString()) ?? fallback;
}

bool toBool(dynamic v, [bool fallback = false]) {
  if (v == null) return fallback;
  if (v is bool) return v;
  return v.toString() == 'true';
}

String toStr(dynamic v, [String fallback = '']) => v == null ? fallback : v.toString();

Map<String, dynamic> toMap(dynamic v) => v is Map ? Map<String, dynamic>.from(v) : <String, dynamic>{};

List<dynamic> toList(dynamic v) => v is List ? v : const [];

DateTime? toDate(dynamic v) => v == null ? null : DateTime.tryParse(v.toString())?.toLocal();

/// Returns the `_id` whether the field is populated or a raw id.
String idOf(dynamic v) {
  if (v == null) return '';
  if (v is Map) return toStr(v['_id']);
  return v.toString();
}
