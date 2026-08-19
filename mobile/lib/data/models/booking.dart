class Booking {
  final String id;
  final String tripId;
  final String serviceType; // 'hotel', 'transport', 'activity', 'tour'
  final String providerName;
  final String serviceName;
  final double price;
  final String currency; // 'ETB', 'USD'
  final DateTime bookingDate;
  final DateTime startDate;
  final DateTime endDate;
  final String status; // 'draft', 'pending', 'confirmed', 'cancelled', 'completed'
  final String confirmationCode;
  final Map<String, dynamic> details;

  Booking({
    required this.id,
    required this.tripId,
    required this.serviceType,
    required this.providerName,
    required this.serviceName,
    required this.price,
    required this.currency,
    required this.bookingDate,
    required this.startDate,
    required this.endDate,
    required this.status,
    required this.confirmationCode,
    required this.details,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'tripId': tripId,
      'serviceType': serviceType,
      'providerName': providerName,
      'serviceName': serviceName,
      'price': price,
      'currency': currency,
      'bookingDate': bookingDate.toIso8601String(),
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      'status': status,
      'confirmationCode': confirmationCode,
      'details': details,
    };
  }

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['id'],
      tripId: json['tripId'],
      serviceType: json['serviceType'],
      providerName: json['providerName'],
      serviceName: json['serviceName'],
      price: json['price'].toDouble(),
      currency: json['currency'],
      bookingDate: DateTime.parse(json['bookingDate']),
      startDate: DateTime.parse(json['startDate']),
      endDate: DateTime.parse(json['endDate']),
      status: json['status'],
      confirmationCode: json['confirmationCode'],
      details: json['details'] ?? {},
    );
  }
}