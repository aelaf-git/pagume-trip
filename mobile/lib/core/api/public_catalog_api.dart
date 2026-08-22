import '../api/api_client.dart';

/// Portal public catalog (images live here; booking IDs stay on /v1).
class PublicCatalogApi {
  PublicCatalogApi({ApiClient? client}) : _client = client ?? ApiClient.instance;

  final ApiClient _client;

  Future<List<Map<String, dynamic>>> destinations() => _list('/api/v1/public/destinations');

  Future<List<Map<String, dynamic>>> hotels() => _list('/api/v1/public/hotels');

  Future<List<Map<String, dynamic>>> tours() => _list('/api/v1/public/tours');

  Future<List<Map<String, dynamic>>> vehicles() => _list('/api/v1/public/vehicles');

  Future<List<Map<String, dynamic>>> _list(String path) {
    return _client.get(
      path,
      parser: (data) {
        final list = data is List ? data : (data is Map ? data['results'] : null);
        if (list is! List) return <Map<String, dynamic>>[];
        return list
            .whereType<Map>()
            .map((e) => Map<String, dynamic>.from(e))
            .toList();
      },
    );
  }
}

String normalizeCatalogName(String name) {
  return name
      .toLowerCase()
      .replaceAll(RegExp(r'[^a-z0-9]+'), ' ')
      .trim()
      .replaceAll(RegExp(r'\s+'), ' ');
}

/// Collect uploaded image URLs from a portal public payload.
List<String> collectImageUrls(Map<String, dynamic> json) {
  final urls = <String>[];

  void add(dynamic value) {
    if (value is String && value.trim().isNotEmpty) {
      final u = value.trim();
      if (!urls.contains(u)) urls.add(u);
    }
  }

  add(json['cover_image']);
  add(json['profile_picture']);
  add(json['profile_picture_url']);

  final images = json['images'];
  if (images is List) {
    for (final item in images) {
      add(item);
    }
  }

  return urls;
}

int? portalIdFromAgentId(String agentId, String prefix) {
  if (!agentId.startsWith(prefix)) return null;
  return int.tryParse(agentId.substring(prefix.length));
}
