import 'json_utils.dart';

class AppNotification {
  final String id;
  final String title;
  final String body;
  final String imageUrl;
  final String type;
  final Map<String, dynamic> data;
  final bool isRead;
  final DateTime? createdAt;

  const AppNotification(this.id, this.title, this.body, this.imageUrl, this.type, this.data, this.isRead, this.createdAt);

  factory AppNotification.fromJson(Map<String, dynamic> j) => AppNotification(
        toStr(j['_id']),
        toStr(j['title']),
        toStr(j['body']),
        toStr(j['imageUrl']),
        toStr(j['type']),
        toMap(j['data']),
        toBool(j['isRead']),
        toDate(j['createdAt']),
      );
}

class WalletTxn {
  final String id;
  final String type;
  final String direction;
  final double amount;
  final String description;
  final DateTime? createdAt;
  const WalletTxn(this.id, this.type, this.direction, this.amount, this.description, this.createdAt);
  factory WalletTxn.fromJson(Map<String, dynamic> j) =>
      WalletTxn(toStr(j['_id']), toStr(j['type']), toStr(j['direction']), toDouble(j['amount']), toStr(j['description']), toDate(j['createdAt']));
}
