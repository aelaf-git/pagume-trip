import '../../data/models/api_booking.dart';
import 'api_client.dart';

class BookingApi {
  BookingApi({ApiClient? client}) : _client = client ?? ApiClient.instance;

  final ApiClient _client;

  Future<ApiBooking> prepare({
    required List<BookingItem> items,
    String? userId,
    String? idempotencyKey,
  }) {
    final key = idempotencyKey ?? _client.newIdempotencyKey();
    return _client.post(
      '/v1/bookings/prepare',
      data: {
        'items': items.map((e) => e.toJson()).toList(),
        if (userId != null) 'user_id': userId,
      },
      headers: {'Idempotency-Key': key},
      parser: (data) => ApiBooking.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<ApiBooking> confirm({
    required String bookingId,
    String? idempotencyKey,
  }) {
    final key = idempotencyKey ?? _client.newIdempotencyKey();
    return _client.post(
      '/v1/bookings/$bookingId/confirm',
      headers: {'Idempotency-Key': key},
      parser: (data) => ApiBooking.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<ApiBooking> getBooking(String bookingId) {
    return _client.get(
      '/v1/bookings/$bookingId',
      parser: (data) => ApiBooking.fromJson(data as Map<String, dynamic>),
    );
  }

  Future<ApiBooking> cancel({
    required String bookingId,
    String? idempotencyKey,
  }) {
    final key = idempotencyKey ?? _client.newIdempotencyKey();
    return _client.post(
      '/v1/bookings/$bookingId/cancel',
      headers: {'Idempotency-Key': key},
      parser: (data) => ApiBooking.fromJson(data as Map<String, dynamic>),
    );
  }
}
