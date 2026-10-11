import 'json_utils.dart';

class Review {
  final String id;
  final String userName;
  final String userAvatar;
  final int rating;
  final int? deliveryRating;
  final String comment;
  final List<String> images;
  final String reply;
  final DateTime? createdAt;

  const Review({
    required this.id,
    required this.userName,
    required this.userAvatar,
    required this.rating,
    required this.deliveryRating,
    required this.comment,
    required this.images,
    required this.reply,
    required this.createdAt,
  });

  factory Review.fromJson(Map<String, dynamic> j) {
    final u = toMap(j['user']);
    return Review(
      id: toStr(j['_id']),
      userName: toStr(u['name']),
      userAvatar: toStr(u['avatar']),
      rating: toInt(j['rating']),
      deliveryRating: j['deliveryRating'] == null ? null : toInt(j['deliveryRating']),
      comment: toStr(j['comment']),
      images: toList(j['images']).map((e) => e.toString()).toList(),
      reply: toStr(toMap(j['reply'])['text']),
      createdAt: toDate(j['createdAt']),
    );
  }
}
