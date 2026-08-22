class Vehicle {
  final String id;
  final String destinationId;
  final String name;
  final String make;
  final String model;
  final int? year;
  final int seats;
  final String transmission;
  final String fuelType;
  final bool is4wd;
  final double dailyPriceEtb;
  final double? weeklyPriceEtb;
  final double depositEtb;
  final String insurance;
  final bool driverIncluded;
  final String serviceType;
  final String pickupLocation;
  final String providerStatus;
  final List<String> availableDates;
  final String currency;
  final List<String> images;

  const Vehicle({
    required this.id,
    required this.destinationId,
    required this.name,
    required this.make,
    required this.model,
    this.year,
    required this.seats,
    this.transmission = 'manual',
    this.fuelType = 'diesel',
    this.is4wd = false,
    required this.dailyPriceEtb,
    this.weeklyPriceEtb,
    this.depositEtb = 0,
    this.insurance = '',
    this.driverIncluded = true,
    this.serviceType = 'private_car',
    this.pickupLocation = '',
    this.providerStatus = 'VERIFIED',
    this.availableDates = const [],
    this.currency = 'ETB',
    this.images = const [],
  });

  String? get coverImage => images.isNotEmpty ? images.first : null;

  String get displayName =>
      name.isNotEmpty ? name : '$make $model'.trim();

  Vehicle copyWith({List<String>? images}) {
    return Vehicle(
      id: id,
      destinationId: destinationId,
      name: name,
      make: make,
      model: model,
      year: year,
      seats: seats,
      transmission: transmission,
      fuelType: fuelType,
      is4wd: is4wd,
      dailyPriceEtb: dailyPriceEtb,
      weeklyPriceEtb: weeklyPriceEtb,
      depositEtb: depositEtb,
      insurance: insurance,
      driverIncluded: driverIncluded,
      serviceType: serviceType,
      pickupLocation: pickupLocation,
      providerStatus: providerStatus,
      availableDates: availableDates,
      currency: currency,
      images: images ?? this.images,
    );
  }

  factory Vehicle.fromJson(Map<String, dynamic> json) {
    return Vehicle(
      id: json['id'] as String,
      destinationId: json['destination_id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      make: json['make'] as String? ?? '',
      model: json['model'] as String? ?? '',
      year: json['year'] as int?,
      seats: json['seats'] as int? ?? 4,
      transmission: json['transmission'] as String? ?? 'manual',
      fuelType: json['fuel_type'] as String? ?? 'diesel',
      is4wd: json['is_4wd'] as bool? ?? false,
      dailyPriceEtb: (json['daily_price_etb'] as num?)?.toDouble() ?? 0,
      weeklyPriceEtb: (json['weekly_price_etb'] as num?)?.toDouble(),
      depositEtb: (json['deposit_etb'] as num?)?.toDouble() ?? 0,
      insurance: json['insurance'] as String? ?? '',
      driverIncluded: json['driver_included'] as bool? ?? true,
      serviceType: json['service_type'] as String? ?? 'private_car',
      pickupLocation: json['pickup_location'] as String? ?? '',
      providerStatus: json['provider_status'] as String? ?? 'VERIFIED',
      availableDates: (json['available_dates'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      currency: json['currency'] as String? ?? 'ETB',
      images: (json['images'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .where((e) => e.isNotEmpty)
              .toList() ??
          const [],
    );
  }
}
