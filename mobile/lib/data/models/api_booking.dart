class BookingItem {
  final String serviceType;
  final String entityId;
  final String name;
  final double priceEtb;
  final String currency;
  final String? roomId;
  final String? checkIn;
  final String? checkOut;

  const BookingItem({
    required this.serviceType,
    required this.entityId,
    required this.name,
    required this.priceEtb,
    this.currency = 'ETB',
    this.roomId,
    this.checkIn,
    this.checkOut,
  });

  Map<String, dynamic> toJson() {
    return {
      'service_type': serviceType,
      'entity_id': entityId,
      'name': name,
      'price_etb': priceEtb,
      'currency': currency,
      if (roomId != null) 'room_id': roomId,
      if (checkIn != null) 'check_in': checkIn,
      if (checkOut != null) 'check_out': checkOut,
    };
  }

  factory BookingItem.fromJson(Map<String, dynamic> json) {
    return BookingItem(
      serviceType: json['service_type'] as String? ?? '',
      entityId: json['entity_id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      priceEtb: (json['price_etb'] as num?)?.toDouble() ?? 0,
      currency: json['currency'] as String? ?? 'ETB',
      roomId: json['room_id'] as String?,
      checkIn: json['check_in'] as String?,
      checkOut: json['check_out'] as String?,
    );
  }
}

class ApiBooking {
  final String id;
  final String? userId;
  final String? providerId;
  final List<BookingItem> items;
  final double priceEtb;
  final String currency;
  final String status;
  final String paymentStatus;
  final String? confirmationCode;
  final String? idempotencyKey;
  final String cancellationPolicy;

  const ApiBooking({
    required this.id,
    this.userId,
    this.providerId,
    this.items = const [],
    required this.priceEtb,
    this.currency = 'ETB',
    required this.status,
    this.paymentStatus = 'UNPAID',
    this.confirmationCode,
    this.idempotencyKey,
    this.cancellationPolicy = '',
  });

  factory ApiBooking.fromJson(Map<String, dynamic> json) {
    return ApiBooking(
      id: json['id'] as String,
      userId: json['user_id'] as String?,
      providerId: json['provider_id'] as String?,
      items: (json['items'] as List<dynamic>?)
              ?.map((e) => BookingItem.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      priceEtb: (json['price_etb'] as num?)?.toDouble() ?? 0,
      currency: json['currency'] as String? ?? 'ETB',
      status: json['status'] as String? ?? 'PENDING',
      paymentStatus: json['payment_status'] as String? ?? 'UNPAID',
      confirmationCode: json['confirmation_code'] as String?,
      idempotencyKey: json['idempotency_key'] as String?,
      cancellationPolicy: json['cancellation_policy'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'provider_id': providerId,
      'items': items.map((e) => e.toJson()).toList(),
      'price_etb': priceEtb,
      'currency': currency,
      'status': status,
      'payment_status': paymentStatus,
      'confirmation_code': confirmationCode,
      'idempotency_key': idempotencyKey,
      'cancellation_policy': cancellationPolicy,
    };
  }

  bool get isConfirmed => status.toUpperCase() == 'CONFIRMED';
}

/// Locally persisted confirmed manual booking for My Trips.
class ManualBookingRecord {
  final String id;
  final String serviceType;
  final String serviceName;
  final double priceEtb;
  final String currency;
  final String status;
  final String? confirmationCode;
  final String? checkIn;
  final String? checkOut;
  final String? destinationId;
  final DateTime bookedAt;

  const ManualBookingRecord({
    required this.id,
    required this.serviceType,
    required this.serviceName,
    required this.priceEtb,
    this.currency = 'ETB',
    required this.status,
    this.confirmationCode,
    this.checkIn,
    this.checkOut,
    this.destinationId,
    required this.bookedAt,
  });

  factory ManualBookingRecord.fromApi(
    ApiBooking booking, {
    String? destinationId,
  }) {
    final first = booking.items.isNotEmpty ? booking.items.first : null;
    return ManualBookingRecord(
      id: booking.id,
      serviceType: first?.serviceType ?? 'unknown',
      serviceName: first?.name ?? 'Booking',
      priceEtb: booking.priceEtb,
      currency: booking.currency,
      status: booking.status,
      confirmationCode: booking.confirmationCode,
      checkIn: first?.checkIn,
      checkOut: first?.checkOut,
      destinationId: destinationId,
      bookedAt: DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'service_type': serviceType,
      'service_name': serviceName,
      'price_etb': priceEtb,
      'currency': currency,
      'status': status,
      'confirmation_code': confirmationCode,
      'check_in': checkIn,
      'check_out': checkOut,
      'destination_id': destinationId,
      'booked_at': bookedAt.toIso8601String(),
    };
  }

  factory ManualBookingRecord.fromJson(Map<String, dynamic> json) {
    return ManualBookingRecord(
      id: json['id'] as String,
      serviceType: json['service_type'] as String? ?? '',
      serviceName: json['service_name'] as String? ?? '',
      priceEtb: (json['price_etb'] as num?)?.toDouble() ?? 0,
      currency: json['currency'] as String? ?? 'ETB',
      status: json['status'] as String? ?? '',
      confirmationCode: json['confirmation_code'] as String?,
      checkIn: json['check_in'] as String?,
      checkOut: json['check_out'] as String?,
      destinationId: json['destination_id'] as String?,
      bookedAt: DateTime.tryParse(json['booked_at'] as String? ?? '') ??
          DateTime.now(),
    );
  }
}
