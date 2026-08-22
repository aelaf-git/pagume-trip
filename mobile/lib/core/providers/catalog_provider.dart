import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/catalog_api.dart';
import 'media_index_provider.dart';
import '../../data/models/destination.dart';
import '../../data/models/hotel.dart';
import '../../data/models/tour_package.dart';
import '../../data/models/vehicle.dart';

final catalogApiProvider = Provider<CatalogApi>((ref) => CatalogApi());

class CatalogFilter {
  final String destinationId;
  final String? checkIn;
  final String? checkOut;
  final int? guests;

  const CatalogFilter({
    required this.destinationId,
    this.checkIn,
    this.checkOut,
    this.guests,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CatalogFilter &&
          destinationId == other.destinationId &&
          checkIn == other.checkIn &&
          checkOut == other.checkOut &&
          guests == other.guests;

  @override
  int get hashCode => Object.hash(destinationId, checkIn, checkOut, guests);
}

Future<CatalogMediaIndex?> _media(Ref ref) async {
  try {
    return await ref.watch(catalogMediaIndexProvider.future);
  } catch (_) {
    return null;
  }
}

Destination _enrichDestination(Destination d, CatalogMediaIndex? media) {
  if (media == null || d.images.isNotEmpty) return d;
  final urls = media.forDestination(name: d.name, agentId: d.id);
  return urls.isEmpty ? d : d.copyWith(images: urls);
}

Hotel _enrichHotel(Hotel h, CatalogMediaIndex? media) {
  if (media == null) return h;
  final hotelUrls =
      h.images.isNotEmpty ? h.images : media.forHotel(name: h.name, agentId: h.id);
  final rooms = h.rooms.map((room) {
    if (room.images.isNotEmpty) return room;
    final roomUrls = media.forRoom(
      hotelAgentId: h.id,
      hotelName: h.name,
      roomType: room.roomType,
    );
    return roomUrls.isEmpty ? room : room.copyWith(images: roomUrls);
  }).toList();
  return h.copyWith(
    images: hotelUrls,
    rooms: rooms,
  );
}

TourPackage _enrichTour(TourPackage t, CatalogMediaIndex? media) {
  if (media == null || t.images.isNotEmpty) return t;
  final urls = media.forTour(name: t.name, agentId: t.id);
  return urls.isEmpty ? t : t.copyWith(images: urls);
}

Vehicle _enrichVehicle(Vehicle v, CatalogMediaIndex? media) {
  if (media == null || v.images.isNotEmpty) return v;
  final urls = media.forVehicle(name: v.displayName, agentId: v.id);
  if (urls.isEmpty && v.name != v.displayName) {
    final byMake = media.forVehicle(name: '${v.make} ${v.model}', agentId: v.id);
    return byMake.isEmpty ? v : v.copyWith(images: byMake);
  }
  return urls.isEmpty ? v : v.copyWith(images: urls);
}

final destinationsProvider =
    FutureProvider.autoDispose<List<Destination>>((ref) async {
  final media = await _media(ref);
  final list = await ref.watch(catalogApiProvider).listDestinations();
  return list.map((d) => _enrichDestination(d, media)).toList();
});

final destinationProvider =
    FutureProvider.autoDispose.family<Destination, String>((ref, id) async {
  final media = await _media(ref);
  final d = await ref.watch(catalogApiProvider).getDestination(id);
  return _enrichDestination(d, media);
});

final hotelsProvider =
    FutureProvider.autoDispose.family<List<Hotel>, CatalogFilter>((ref, filter) async {
  final media = await _media(ref);
  final list = await ref.watch(catalogApiProvider).listHotels(
        destinationId: filter.destinationId,
        guests: filter.guests,
        checkIn: filter.checkIn,
        checkOut: filter.checkOut,
      );
  return list.map((h) => _enrichHotel(h, media)).toList();
});

final hotelProvider =
    FutureProvider.autoDispose.family<Hotel, String>((ref, id) async {
  final media = await _media(ref);
  final h = await ref.watch(catalogApiProvider).getHotel(id);
  return _enrichHotel(h, media);
});

final toursProvider = FutureProvider.autoDispose
    .family<List<TourPackage>, CatalogFilter>((ref, filter) async {
  final media = await _media(ref);
  final list = await ref.watch(catalogApiProvider).listTours(
        destinationId: filter.destinationId,
        guests: filter.guests,
        checkIn: filter.checkIn,
        checkOut: filter.checkOut,
      );
  return list.map((t) => _enrichTour(t, media)).toList();
});

final tourProvider =
    FutureProvider.autoDispose.family<TourPackage, String>((ref, id) async {
  final media = await _media(ref);
  final t = await ref.watch(catalogApiProvider).getTour(id);
  return _enrichTour(t, media);
});

final vehiclesProvider =
    FutureProvider.autoDispose.family<List<Vehicle>, CatalogFilter>((ref, filter) async {
  final media = await _media(ref);
  final list = await ref.watch(catalogApiProvider).listCarRentals(
        destinationId: filter.destinationId,
        seats: filter.guests,
        checkIn: filter.checkIn,
        checkOut: filter.checkOut,
      );
  return list.map((v) => _enrichVehicle(v, media)).toList();
});
