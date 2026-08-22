import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../api/public_catalog_api.dart';

class CatalogMediaIndex {
  CatalogMediaIndex({
    required this.destinationsByName,
    required this.hotelsByName,
    required this.hotelsByPortalId,
    required this.toursByName,
    required this.toursByPortalId,
    required this.vehiclesByName,
    required this.vehiclesByPortalId,
    required this.roomsByHotelPortalAndType,
  });

  final Map<String, List<String>> destinationsByName;
  final Map<String, List<String>> hotelsByName;
  final Map<int, List<String>> hotelsByPortalId;
  final Map<String, List<String>> toursByName;
  final Map<int, List<String>> toursByPortalId;
  final Map<String, List<String>> vehiclesByName;
  final Map<int, List<String>> vehiclesByPortalId;

  /// Key: "$portalHotelId|${normalizedRoomType}" or "name:${hotelName}|${roomType}"
  final Map<String, List<String>> roomsByHotelPortalAndType;

  List<String> forDestination({required String name, String? agentId}) {
    return List<String>.from(
      destinationsByName[normalizeCatalogName(name)] ?? const [],
    );
  }

  List<String> _lookupByName(Map<String, List<String>> byName, String name) {
    final key = normalizeCatalogName(name);
    if (byName.containsKey(key)) return List<String>.from(byName[key]!);
    // Soft match: longest name containment either way
    MapEntry<String, List<String>>? best;
    for (final entry in byName.entries) {
      if (key.isEmpty || entry.key.isEmpty) continue;
      if (key.contains(entry.key) || entry.key.contains(key)) {
        if (best == null || entry.key.length > best.key.length) {
          best = entry;
        }
      }
    }
    return best == null ? const [] : List<String>.from(best.value);
  }

  List<String> forHotel({required String name, required String agentId}) {
    final portalId = portalIdFromAgentId(agentId, 'portal_hotel_');
    if (portalId != null && hotelsByPortalId.containsKey(portalId)) {
      return List<String>.from(hotelsByPortalId[portalId]!);
    }
    return _lookupByName(hotelsByName, name);
  }

  List<String> forTour({required String name, required String agentId}) {
    final portalId = portalIdFromAgentId(agentId, 'portal_tour_');
    if (portalId != null && toursByPortalId.containsKey(portalId)) {
      return List<String>.from(toursByPortalId[portalId]!);
    }
    return _lookupByName(toursByName, name);
  }

  List<String> forVehicle({required String name, required String agentId}) {
    final portalId = portalIdFromAgentId(agentId, 'portal_vehicle_');
    if (portalId != null && vehiclesByPortalId.containsKey(portalId)) {
      return List<String>.from(vehiclesByPortalId[portalId]!);
    }
    return _lookupByName(vehiclesByName, name);
  }

  List<String> forRoom({
    required String hotelAgentId,
    required String hotelName,
    required String roomType,
  }) {
    final portalId = portalIdFromAgentId(hotelAgentId, 'portal_hotel_');
    final typeKey = normalizeCatalogName(roomType);
    if (portalId != null) {
      final key = '$portalId|$typeKey';
      if (roomsByHotelPortalAndType.containsKey(key)) {
        return List<String>.from(roomsByHotelPortalAndType[key]!);
      }
    }
    final nameKey = 'name:${normalizeCatalogName(hotelName)}|$typeKey';
    if (roomsByHotelPortalAndType.containsKey(nameKey)) {
      return List<String>.from(roomsByHotelPortalAndType[nameKey]!);
    }
    return const [];
  }
}

final publicCatalogApiProvider =
    Provider<PublicCatalogApi>((ref) => PublicCatalogApi());

final catalogMediaIndexProvider =
    FutureProvider<CatalogMediaIndex>((ref) async {
  final api = ref.watch(publicCatalogApiProvider);

  final results = await Future.wait([
    api.destinations(),
    api.hotels(),
    api.tours(),
    api.vehicles(),
  ]);

  final destinations = results[0];
  final hotels = results[1];
  final tours = results[2];
  final vehicles = results[3];

  final destinationsByName = <String, List<String>>{};
  for (final d in destinations) {
    final name = normalizeCatalogName('${d['name'] ?? ''}');
    final urls = collectImageUrls(d);
    if (name.isNotEmpty && urls.isNotEmpty) {
      destinationsByName[name] = urls;
    }
  }

  final hotelsByName = <String, List<String>>{};
  final hotelsByPortalId = <int, List<String>>{};
  final roomsByHotelPortalAndType = <String, List<String>>{};

  for (final h in hotels) {
    final name = normalizeCatalogName('${h['name'] ?? ''}');
    final urls = collectImageUrls(h);
    final id = h['id'];
    if (name.isNotEmpty && urls.isNotEmpty) {
      hotelsByName[name] = urls;
    }
    if (id is int && urls.isNotEmpty) {
      hotelsByPortalId[id] = urls;
    } else if (id is num && urls.isNotEmpty) {
      hotelsByPortalId[id.toInt()] = urls;
    }

    final rooms = h['rooms'];
    if (rooms is List) {
      final hotelPortalId = id is int ? id : (id is num ? id.toInt() : null);
      final hotelNameKey = normalizeCatalogName('${h['name'] ?? ''}');
      for (final room in rooms.whereType<Map>()) {
        final roomMap = Map<String, dynamic>.from(room);
        final roomType = normalizeCatalogName('${roomMap['room_type'] ?? ''}');
        final roomUrls = collectImageUrls(roomMap);
        if (roomType.isEmpty || roomUrls.isEmpty) continue;
        if (hotelPortalId != null) {
          roomsByHotelPortalAndType['$hotelPortalId|$roomType'] = roomUrls;
        }
        if (hotelNameKey.isNotEmpty) {
          roomsByHotelPortalAndType['name:$hotelNameKey|$roomType'] = roomUrls;
        }
      }
    }
  }

  final toursByName = <String, List<String>>{};
  final toursByPortalId = <int, List<String>>{};
  for (final t in tours) {
    final name = normalizeCatalogName('${t['name'] ?? ''}');
    final urls = collectImageUrls(t);
    final id = t['id'];
    if (name.isNotEmpty && urls.isNotEmpty) {
      toursByName[name] = urls;
    }
    if (id is int && urls.isNotEmpty) {
      toursByPortalId[id] = urls;
    } else if (id is num && urls.isNotEmpty) {
      toursByPortalId[id.toInt()] = urls;
    }
  }

  final vehiclesByName = <String, List<String>>{};
  final vehiclesByPortalId = <int, List<String>>{};
  for (final v in vehicles) {
    final name = normalizeCatalogName('${v['name'] ?? ''}');
    final urls = collectImageUrls(v);
    final id = v['id'];
    if (name.isNotEmpty && urls.isNotEmpty) {
      vehiclesByName[name] = urls;
    }
    if (id is int && urls.isNotEmpty) {
      vehiclesByPortalId[id] = urls;
    } else if (id is num && urls.isNotEmpty) {
      vehiclesByPortalId[id.toInt()] = urls;
    }
  }

  return CatalogMediaIndex(
    destinationsByName: destinationsByName,
    hotelsByName: hotelsByName,
    hotelsByPortalId: hotelsByPortalId,
    toursByName: toursByName,
    toursByPortalId: toursByPortalId,
    vehiclesByName: vehiclesByName,
    vehiclesByPortalId: vehiclesByPortalId,
    roomsByHotelPortalAndType: roomsByHotelPortalAndType,
  );
});
