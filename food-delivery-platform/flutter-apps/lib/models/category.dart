import 'json_utils.dart';

class CategoryModel {
  final String id;
  final String name;
  final String nameKey;
  final String type;
  final String image;
  final int order;

  const CategoryModel({required this.id, required this.name, required this.nameKey, required this.type, required this.image, required this.order});

  factory CategoryModel.fromJson(Map<String, dynamic> j) => CategoryModel(
        id: toStr(j['_id']),
        name: toStr(j['name']),
        nameKey: toStr(j['nameKey']),
        type: toStr(j['type'], 'category'),
        image: toStr(j['image']),
        order: toInt(j['order']),
      );
}
