class TourPackage {
  final String id;
  final String destinationId;
  final String agencyId;
  final String name;
  final String description;
  final double? durationHours;
  final int? durationDays;
  final double priceEtb;
  final String currency;
  final int maxParticipants;
  final int minParticipants;
  final List<String> included;
  final List<String> excluded;
  final String category;
  final int seatsRemaining;
  final String providerStatus;
  final List<String> availableDates;
  final List<String> images;

  const TourPackage({
    required this.id,
    required this.destinationId,
    required this.agencyId,
    required this.name,
    this.description = '',
    this.durationHours,
    this.durationDays,
    required this.priceEtb,
    this.currency = 'ETB',
    this.maxParticipants = 12,
    this.minParticipants = 1,
    this.included = const [],
    this.excluded = const [],
    this.category = 'tour',
    this.seatsRemaining = 8,
    this.providerStatus = 'VERIFIED',
    this.availableDates = const [],
    this.images = const [],
  });

  String? get coverImage => images.isNotEmpty ? images.first : null;

  TourPackage copyWith({List<String>? images}) {
    return TourPackage(
      id: id,
      destinationId: destinationId,
      agencyId: agencyId,
      name: name,
      description: description,
      durationHours: durationHours,
      durationDays: durationDays,
      priceEtb: priceEtb,
      currency: currency,
      maxParticipants: maxParticipants,
      minParticipants: minParticipants,
      included: included,
      excluded: excluded,
      category: category,
      seatsRemaining: seatsRemaining,
      providerStatus: providerStatus,
      availableDates: availableDates,
      images: images ?? this.images,
    );
  }

  factory TourPackage.fromJson(Map<String, dynamic> json) {
    return TourPackage(
      id: json['id'] as String,
      destinationId: json['destination_id'] as String? ?? '',
      agencyId: json['agency_id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      description: json['description'] as String? ?? '',
      durationHours: (json['duration_hours'] as num?)?.toDouble(),
      durationDays: json['duration_days'] as int?,
      priceEtb: (json['price_etb'] as num?)?.toDouble() ?? 0,
      currency: json['currency'] as String? ?? 'ETB',
      maxParticipants: json['max_participants'] as int? ?? 12,
      minParticipants: json['min_participants'] as int? ?? 1,
      included: (json['included'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      excluded: (json['excluded'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      category: json['category'] as String? ?? 'tour',
      seatsRemaining: json['seats_remaining'] as int? ?? 8,
      providerStatus: json['provider_status'] as String? ?? 'VERIFIED',
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

  String get durationLabel {
    if (durationDays != null && durationDays! > 0) {
      return '${durationDays!} day${durationDays! == 1 ? '' : 's'}';
    }
    if (durationHours != null && durationHours! > 0) {
      return '${durationHours!.toStringAsFixed(0)} hours';
    }
    return 'Flexible';
  }
}
