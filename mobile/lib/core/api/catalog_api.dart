import '../../data/models/destination.dart';
import '../../data/models/hotel.dart';
import '../../data/models/tour_package.dart';
import '../../data/models/vehicle.dart';
import 'api_client.dart';

class CatalogApi {
  CatalogApi({ApiClient? client}) : _client = client ?? ApiClient.instance;

  final ApiClient _client;

  List<T> _parseResults<T>(
    dynamic data,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    final list = (data is Map ? data['results'] : data) as List<dynamic>? ?? [];
    return list
        .map((e) => fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<Destination>> listDestinations({String? q, String? region}) {
    return _client.get(
      '/v1/destinations',
      queryParameters: {
        if (q != null && q.isNotEmpty) 'q': q,
        if (region != null && region.isNotEmpty) 'region': region,
      },
      parser: (data) => _parseResults(data, Destination.fromJson),
    );
  }

  Future<Destination> getDestination(String id) {
    return _client.get(
      '/v1/destinations/$id',
      parser: (data) => Destination.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<List<Hotel>> listHotels({
    required String destinationId,
    int? guests,
    double? maxPriceEtb,
    String? checkIn,
    String? checkOut,
  }) {
    return _client.get(
      '/v1/hotels',
      queryParameters: {
        'destination_id': destinationId,
        if (guests != null) 'guests': guests,
        if (maxPriceEtb != null) 'max_price_etb': maxPriceEtb,
        if (checkIn != null) 'check_in': checkIn,
        if (checkOut != null) 'check_out': checkOut,
      },
      parser: (data) => _parseResults(data, Hotel.fromJson),
    );
  }

  Future<Hotel> getHotel(String hotelId) {
    return _client.get(
      '/v1/hotels/$hotelId',
      parser: (data) => Hotel.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<bool> checkRoomAvailability({
    required String hotelId,
    required String roomId,
    required String checkIn,
    required String checkOut,
  }) {
    return _client.get(
      '/v1/hotels/$hotelId/rooms/$roomId/availability',
      queryParameters: {
        'check_in': checkIn,
        'check_out': checkOut,
      },
      parser: (data) =>
          (data is Map ? data['available'] as bool? : null) ?? false,
    );
  }

  Future<List<TourPackage>> listTours({
    required String destinationId,
    String? q,
    int? guests,
    String? checkIn,
    String? checkOut,
  }) {
    return _client.get(
      '/v1/tours',
      queryParameters: {
        'destination_id': destinationId,
        if (q != null && q.isNotEmpty) 'q': q,
        if (guests != null) 'guests': guests,
        if (checkIn != null) 'check_in': checkIn,
        if (checkOut != null) 'check_out': checkOut,
      },
      parser: (data) => _parseResults(data, TourPackage.fromJson),
    );
  }

  Future<TourPackage> getTour(String packageId) {
    return _client.get(
      '/v1/tours/$packageId',
      parser: (data) => TourPackage.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<bool> checkTourAvailability({
    required String packageId,
    required String date,
    int guests = 1,
  }) {
    return _client.get(
      '/v1/tours/$packageId/availability',
      queryParameters: {
        'date': date,
        'guests': guests,
      },
      parser: (data) =>
          (data is Map ? data['available'] as bool? : null) ?? false,
    );
  }

  Future<List<Vehicle>> listCarRentals({
    required String destinationId,
    int? seats,
    bool? is4wd,
    String? checkIn,
    String? checkOut,
  }) {
    return _client.get(
      '/v1/car-rentals',
      queryParameters: {
        'destination_id': destinationId,
        if (seats != null) 'seats': seats,
        if (is4wd != null) 'is_4wd': is4wd,
        if (checkIn != null) 'check_in': checkIn,
        if (checkOut != null) 'check_out': checkOut,
      },
      parser: (data) => _parseResults(data, Vehicle.fromJson),
    );
  }

  Future<bool> checkVehicleAvailability({
    required String vehicleId,
    required String startDate,
    required String endDate,
  }) {
    return _client.get(
      '/v1/vehicles/$vehicleId/availability',
      queryParameters: {
        'start_date': startDate,
        'end_date': endDate,
      },
      parser: (data) =>
          (data is Map ? data['available'] as bool? : null) ?? false,
    );
  }
}
