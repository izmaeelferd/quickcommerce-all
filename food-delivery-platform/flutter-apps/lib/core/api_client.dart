import 'dart:async';

import 'package:dio/dio.dart';

import '../services/storage_service.dart';
import 'env.dart';

class ApiException implements Exception {
  final int? statusCode;
  final String messageKey;
  final dynamic details;
  ApiException(this.statusCode, this.messageKey, [this.details]);
  @override
  String toString() => messageKey;
}

/// Single Dio instance with JWT auth, transparent refresh and error normalisation.
class ApiClient {
  ApiClient._() {
    dio = Dio(BaseOptions(
      baseUrl: Env.apiUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'X-App-Type': Env.appType},
    ));
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        final token = StorageService.instance.accessToken;
        if (token != null && options.headers['Authorization'] == null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        final lang = StorageService.instance.language;
        if (lang != null) options.headers['Accept-Language'] = lang;
        handler.next(options);
      },
      onError: (err, handler) async {
        final status = err.response?.statusCode;
        final isAuthCall = err.requestOptions.path.contains('/auth/refresh-token');
        if (status == 401 && !isAuthCall && StorageService.instance.refreshToken != null && err.requestOptions.extra['retried'] != true) {
          final refreshed = await _refresh();
          if (refreshed) {
            final opts = err.requestOptions;
            opts.extra['retried'] = true;
            opts.headers['Authorization'] = 'Bearer ${StorageService.instance.accessToken}';
            try {
              final resp = await dio.fetch(opts);
              return handler.resolve(resp);
            } catch (e) {
              return handler.next(err);
            }
          } else {
            await StorageService.instance.clearTokens();
            _sessionExpired.add(null);
          }
        }
        if (status == 503) {
          final data = err.response?.data;
          if (data is Map && data['message'] == 'maintenance.active') _maintenance.add(Map<String, dynamic>.from(data['data']?['maintenance'] ?? {}));
        }
        handler.next(err);
      },
    ));
  }

  static final ApiClient instance = ApiClient._();
  late final Dio dio;

  final _sessionExpired = StreamController<void>.broadcast();
  final _maintenance = StreamController<Map<String, dynamic>>.broadcast();
  Stream<void> get onSessionExpired => _sessionExpired.stream;
  Stream<Map<String, dynamic>> get onMaintenance => _maintenance.stream;

  Completer<bool>? _refreshing;

  Future<bool> _refresh() async {
    if (_refreshing != null) return _refreshing!.future;
    _refreshing = Completer<bool>();
    try {
      final resp = await Dio(BaseOptions(baseUrl: Env.apiUrl, headers: {'X-App-Type': Env.appType}))
          .post('/auth/refresh-token', data: {'refreshToken': StorageService.instance.refreshToken});
      final data = resp.data['data'];
      await StorageService.instance.saveTokens(data['accessToken'], data['refreshToken']);
      _refreshing!.complete(true);
    } catch (_) {
      _refreshing!.complete(false);
    }
    final result = await _refreshing!.future;
    _refreshing = null;
    return result;
  }

  ApiException _wrap(Object e) {
    if (e is DioException) {
      final data = e.response?.data;
      if (data is Map && data['message'] != null) {
        return ApiException(e.response?.statusCode, data['message'].toString(), data['details']);
      }
      if (e.type == DioExceptionType.connectionError || e.type == DioExceptionType.connectionTimeout) {
        return ApiException(null, 'error.network');
      }
      return ApiException(e.response?.statusCode, 'error.generic');
    }
    return ApiException(null, 'error.generic');
  }

  dynamic _unwrap(Response resp) {
    final body = resp.data;
    if (body is Map && body.containsKey('data')) return body['data'];
    return body;
  }

  Future<dynamic> get(String path, {Map<String, dynamic>? query}) async {
    try {
      return _unwrap(await dio.get(path, queryParameters: _clean(query)));
    } catch (e) {
      throw _wrap(e);
    }
  }

  Future<dynamic> post(String path, {dynamic data}) async {
    try {
      return _unwrap(await dio.post(path, data: data));
    } catch (e) {
      throw _wrap(e);
    }
  }

  Future<dynamic> put(String path, {dynamic data}) async {
    try {
      return _unwrap(await dio.put(path, data: data));
    } catch (e) {
      throw _wrap(e);
    }
  }

  Future<dynamic> patch(String path, {dynamic data}) async {
    try {
      return _unwrap(await dio.patch(path, data: data));
    } catch (e) {
      throw _wrap(e);
    }
  }

  Future<dynamic> delete(String path) async {
    try {
      return _unwrap(await dio.delete(path));
    } catch (e) {
      throw _wrap(e);
    }
  }

  Future<String> uploadImage(String filePath, {String folder = 'images'}) async {
    try {
      final form = FormData.fromMap({'folder': folder, 'image': await MultipartFile.fromFile(filePath)});
      final data = _unwrap(await dio.post('/upload/image', data: form));
      return data['url'] as String;
    } catch (e) {
      throw _wrap(e);
    }
  }

  Map<String, dynamic>? _clean(Map<String, dynamic>? q) {
    if (q == null) return null;
    final out = <String, dynamic>{};
    q.forEach((k, v) {
      if (v != null && v.toString().isNotEmpty) out[k] = v;
    });
    return out;
  }
}
