class HotelRoom {
  final String id;
  final String hotelId;
  final String roomType;
  final String description;
  final int capacity;
  final int beds;
  final List<String> amenities;
  final double nightlyPriceEtb;
  final String currency;
  final List<String> images;

  const HotelRoom({
    required this.id,
    required this.hotelId,
    required this.roomType,
    this.description = '',
    required this.capacity,
    this.beds = 1,
    this.amenities = const [],
    required this.nightlyPriceEtb,
    this.currency = 'ETB',
    this.images = const [],
  });

  String? get coverImage => images.isNotEmpty ? images.first : null;

  HotelRoom copyWith({List<String>? images}) {
    return HotelRoom(
      id: id,
      hotelId: hotelId,
      roomType: roomType,
      description: description,
      capacity: capacity,
      beds: beds,
      amenities: amenities,
      nightlyPriceEtb: nightlyPriceEtb,
      currency: currency,
      images: images ?? this.images,
    );
  }

  factory HotelRoom.fromJson(Map<String, dynamic> json) {
    return HotelRoom(
      id: json['id'] as String,
      hotelId: json['hotel_id'] as String? ?? '',
      roomType: json['room_type'] as String? ?? '',
      description: json['description'] as String? ?? '',
      capacity: json['capacity'] as int? ?? 1,
      beds: json['beds'] as int? ?? 1,
      amenities: (json['amenities'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      nightlyPriceEtb: (json['nightly_price_etb'] as num?)?.toDouble() ?? 0,
      currency: json['currency'] as String? ?? 'ETB',
      images: (json['images'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .where((e) => e.isNotEmpty)
              .toList() ??
          const [],
    );
  }
}

class Hotel {
  final String id;
  final String destinationId;
  final String name;
  final String description;
  final String propertyType;
  final double latitude;
  final double longitude;
  final List<String> amenities;
  final double rating;
  final String comfortLevel;
  final String checkInTime;
  final String checkOutTime;
  final String providerStatus;
  final List<HotelRoom> rooms;
  final List<String> availableDates;
  final List<String> images;

  const Hotel({
    required this.id,
    required this.destinationId,
    required this.name,
    this.description = '',
    this.propertyType = 'hotel',
    required this.latitude,
    required this.longitude,
    this.amenities = const [],
    this.rating = 0,
    this.comfortLevel = 'standard',
    this.checkInTime = '14:00',
    this.checkOutTime = '11:00',
    this.providerStatus = 'VERIFIED',
    this.rooms = const [],
    this.availableDates = const [],
    this.images = const [],
  });

  String? get coverImage => images.isNotEmpty ? images.first : null;

  Hotel copyWith({
    List<String>? images,
    List<HotelRoom>? rooms,
  }) {
    return Hotel(
      id: id,
      destinationId: destinationId,
      name: name,
      description: description,
      propertyType: propertyType,
      latitude: latitude,
      longitude: longitude,
      amenities: amenities,
      rating: rating,
      comfortLevel: comfortLevel,
      checkInTime: checkInTime,
      checkOutTime: checkOutTime,
      providerStatus: providerStatus,
      rooms: rooms ?? this.rooms,
      availableDates: availableDates,
      images: images ?? this.images,
    );
  }

  factory Hotel.fromJson(Map<String, dynamic> json) {
    return Hotel(
      id: json['id'] as String,
      destinationId: json['destination_id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      description: json['description'] as String? ?? '',
      propertyType: json['property_type'] as String? ?? 'hotel',
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0,
      amenities: (json['amenities'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      rating: (json['rating'] as num?)?.toDouble() ?? 0,
      comfortLevel: json['comfort_level'] as String? ?? 'standard',
      checkInTime: json['check_in_time'] as String? ?? '14:00',
      checkOutTime: json['check_out_time'] as String? ?? '11:00',
      providerStatus: json['provider_status'] as String? ?? 'VERIFIED',
      rooms: (json['rooms'] as List<dynamic>?)
              ?.map((e) => HotelRoom.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      availableDates: (json['available_dates'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      images: (json['images'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .where((e) => e.isNotEmpty)
              .toList() ??
          const [],
    );
  }

  double get startingPrice {
    if (rooms.isEmpty) return 0;
    return rooms
        .map((r) => r.nightlyPriceEtb)
        .reduce((a, b) => a < b ? a : b);
  }
}
