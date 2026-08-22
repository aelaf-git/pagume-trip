class Destination {
  final String id;
  final String name;
  final String description;
  final String region;
  final String zone;
  final String? woreda;
  final double latitude;
  final double longitude;
  final String category;
  final int? recommendedDurationDays;
  final String verificationStatus;
  final List<String> images;

  const Destination({
    required this.id,
    required this.name,
    this.description = '',
    this.region = '',
    this.zone = '',
    this.woreda,
    required this.latitude,
    required this.longitude,
    this.category = 'destination',
    this.recommendedDurationDays,
    this.verificationStatus = 'VERIFIED',
    this.images = const [],
  });

  String? get coverImage => images.isNotEmpty ? images.first : null;

  Destination copyWith({List<String>? images}) {
    return Destination(
      id: id,
      name: name,
      description: description,
      region: region,
      zone: zone,
      woreda: woreda,
      latitude: latitude,
      longitude: longitude,
      category: category,
      recommendedDurationDays: recommendedDurationDays,
      verificationStatus: verificationStatus,
      images: images ?? this.images,
    );
  }

  factory Destination.fromJson(Map<String, dynamic> json) {
    final imageList = (json['images'] as List<dynamic>?)
            ?.map((e) => e.toString())
            .where((e) => e.isNotEmpty)
            .toList() ??
        const <String>[];
    return Destination(
      id: json['id'].toString(),
      name: json['name'] as String? ?? '',
      description: json['description'] as String? ?? '',
      region: json['region'] as String? ?? '',
      zone: json['zone'] as String? ?? '',
      woreda: json['woreda'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble() ?? 0,
      longitude: (json['longitude'] as num?)?.toDouble() ?? 0,
      category: json['category'] as String? ?? 'destination',
      recommendedDurationDays: json['recommended_duration_days'] as int?,
      verificationStatus: json['verification_status'] as String? ?? 'VERIFIED',
      images: imageList,
    );
  }
}
