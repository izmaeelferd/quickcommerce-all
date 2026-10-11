import 'json_utils.dart';

class BannerModel {
  final String id;
  final String title;
  final String subtitle;
  final String imageUrl;
  final String placement;
  final String linkType;
  final String linkValue;
  final String backgroundColor;
  final int order;

  const BannerModel({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.imageUrl,
    required this.placement,
    required this.linkType,
    required this.linkValue,
    required this.backgroundColor,
    required this.order,
  });

  factory BannerModel.fromJson(Map<String, dynamic> j) => BannerModel(
        id: toStr(j['_id']),
        title: toStr(j['title']),
        subtitle: toStr(j['subtitle']),
        imageUrl: toStr(j['imageUrl']),
        placement: toStr(j['placement'], 'home'),
        linkType: toStr(j['linkType'], 'none'),
        linkValue: toStr(j['linkValue']),
        backgroundColor: toStr(j['backgroundColor']),
        order: toInt(j['order']),
      );
}
