import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../api/booking_api.dart';
import '../api/catalog_api.dart';
import '../../data/models/api_booking.dart';
import '../../data/models/hotel.dart';
import '../../data/models/tour_package.dart';
import '../../data/models/vehicle.dart';
import 'user_provider.dart';

enum ManualServiceType { hotel, tour, vehicle }

class CheckoutDraft {
  final ManualServiceType serviceType;
  final String entityId;
  final String name;
  final String destinationId;
  final double unitPriceEtb;
  final String currency;
  final String? roomId;
  final String? roomType;
  final DateTime? checkIn;
  final DateTime? checkOut;
  final int guests;

  const CheckoutDraft({
    required this.serviceType,
    required this.entityId,
    required this.name,
    required this.destinationId,
    required this.unitPriceEtb,
    this.currency = 'ETB',
    this.roomId,
    this.roomType,
    this.checkIn,
    this.checkOut,
    this.guests = 1,
  });

  CheckoutDraft copyWith({
    ManualServiceType? serviceType,
    String? entityId,
    String? name,
    String? destinationId,
    double? unitPriceEtb,
    String? currency,
    String? roomId,
    String? roomType,
    DateTime? checkIn,
    DateTime? checkOut,
    int? guests,
  }) {
    return CheckoutDraft(
      serviceType: serviceType ?? this.serviceType,
      entityId: entityId ?? this.entityId,
      name: name ?? this.name,
      destinationId: destinationId ?? this.destinationId,
      unitPriceEtb: unitPriceEtb ?? this.unitPriceEtb,
      currency: currency ?? this.currency,
      roomId: roomId ?? this.roomId,
      roomType: roomType ?? this.roomType,
      checkIn: checkIn ?? this.checkIn,
      checkOut: checkOut ?? this.checkOut,
      guests: guests ?? this.guests,
    );
  }

  int get nightCount {
    if (checkIn == null || checkOut == null) return 1;
    final nights = checkOut!.difference(checkIn!).inDays;
    return nights < 1 ? 1 : nights;
  }

  double get totalPrice {
    switch (serviceType) {
      case ManualServiceType.hotel:
        return unitPriceEtb * nightCount;
      case ManualServiceType.vehicle:
        return unitPriceEtb * nightCount;
      case ManualServiceType.tour:
        return unitPriceEtb;
    }
  }

  String get serviceTypeApi {
    switch (serviceType) {
      case ManualServiceType.hotel:
        return 'hotel';
      case ManualServiceType.vehicle:
        return 'vehicle';
      case ManualServiceType.tour:
        return 'tour';
    }
  }

  static String formatDate(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-'
      '${d.month.toString().padLeft(2, '0')}-'
      '${d.day.toString().padLeft(2, '0')}';
}

class ManualBookingState {
  final CheckoutDraft? draft;
  final bool isSubmitting;
  final String? error;
  final ApiBooking? pendingBooking;
  final ApiBooking? confirmedBooking;
  final List<ManualBookingRecord> history;

  const ManualBookingState({
    this.draft,
    this.isSubmitting = false,
    this.error,
    this.pendingBooking,
    this.confirmedBooking,
    this.history = const [],
  });

  ManualBookingState copyWith({
    CheckoutDraft? draft,
    bool? isSubmitting,
    String? error,
    ApiBooking? pendingBooking,
    ApiBooking? confirmedBooking,
    List<ManualBookingRecord>? history,
    bool clearError = false,
    bool clearDraft = false,
    bool clearPending = false,
    bool clearConfirmed = false,
  }) {
    return ManualBookingState(
      draft: clearDraft ? null : (draft ?? this.draft),
      isSubmitting: isSubmitting ?? this.isSubmitting,
      error: clearError ? null : (error ?? this.error),
      pendingBooking: clearPending ? null : (pendingBooking ?? this.pendingBooking),
      confirmedBooking:
          clearConfirmed ? null : (confirmedBooking ?? this.confirmedBooking),
      history: history ?? this.history,
    );
  }
}

final bookingApiProvider = Provider<BookingApi>((ref) => BookingApi());

final manualBookingProvider =
    StateNotifierProvider<ManualBookingNotifier, ManualBookingState>((ref) {
  return ManualBookingNotifier(
    bookingApi: ref.watch(bookingApiProvider),
    catalogApi: CatalogApi(),
    ref: ref,
  );
});

class ManualBookingNotifier extends StateNotifier<ManualBookingState> {
  ManualBookingNotifier({
    required BookingApi bookingApi,
    required CatalogApi catalogApi,
    required Ref ref,
  })  : _bookingApi = bookingApi,
        _catalogApi = catalogApi,
        _ref = ref,
        super(const ManualBookingState()) {
    _loadHistory();
  }

  static const _historyKey = 'manual_bookings';

  final BookingApi _bookingApi;
  final CatalogApi _catalogApi;
  final Ref _ref;

  Future<void> _loadHistory() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_historyKey);
      if (raw == null) return;
      final list = (jsonDecode(raw) as List<dynamic>)
          .map((e) => ManualBookingRecord.fromJson(e as Map<String, dynamic>))
          .toList();
      state = state.copyWith(history: list);
    } catch (_) {}
  }

  Future<void> _persistHistory(List<ManualBookingRecord> history) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
      _historyKey,
      jsonEncode(history.map((e) => e.toJson()).toList()),
    );
  }

  void startHotelCheckout({
    required Hotel hotel,
    required HotelRoom room,
  }) {
    final now = DateTime.now();
    final checkIn = DateTime(now.year, now.month, now.day + 1);
    final checkOut = checkIn.add(const Duration(days: 2));
    state = ManualBookingState(
      draft: CheckoutDraft(
        serviceType: ManualServiceType.hotel,
        entityId: hotel.id,
        name: '${hotel.name} — ${room.roomType}',
        destinationId: hotel.destinationId,
        unitPriceEtb: room.nightlyPriceEtb,
        currency: room.currency,
        roomId: room.id,
        roomType: room.roomType,
        checkIn: checkIn,
        checkOut: checkOut,
        guests: room.capacity.clamp(1, 10),
      ),
      history: state.history,
    );
  }

  void startTourCheckout({required TourPackage tour}) {
    final now = DateTime.now();
    final checkIn = DateTime(now.year, now.month, now.day + 1);
    final days = (tour.durationDays ?? 1).clamp(1, 30);
    state = ManualBookingState(
      draft: CheckoutDraft(
        serviceType: ManualServiceType.tour,
        entityId: tour.id,
        name: tour.name,
        destinationId: tour.destinationId,
        unitPriceEtb: tour.priceEtb,
        currency: tour.currency,
        checkIn: checkIn,
        checkOut: checkIn.add(Duration(days: days)),
        guests: 1,
      ),
      history: state.history,
    );
  }

  void startVehicleCheckout({required Vehicle vehicle}) {
    final now = DateTime.now();
    final checkIn = DateTime(now.year, now.month, now.day + 1);
    final checkOut = checkIn.add(const Duration(days: 3));
    state = ManualBookingState(
      draft: CheckoutDraft(
        serviceType: ManualServiceType.vehicle,
        entityId: vehicle.id,
        name: vehicle.name.isNotEmpty
            ? vehicle.name
            : '${vehicle.make} ${vehicle.model}',
        destinationId: vehicle.destinationId,
        unitPriceEtb: vehicle.dailyPriceEtb,
        currency: vehicle.currency,
        checkIn: checkIn,
        checkOut: checkOut,
        guests: vehicle.seats.clamp(1, 20),
      ),
      history: state.history,
    );
  }

  void updateDates({DateTime? checkIn, DateTime? checkOut}) {
    final draft = state.draft;
    if (draft == null) return;
    state = state.copyWith(
      draft: draft.copyWith(checkIn: checkIn, checkOut: checkOut),
      clearError: true,
    );
  }

  void updateGuests(int guests) {
    final draft = state.draft;
    if (draft == null) return;
    state = state.copyWith(
      draft: draft.copyWith(guests: guests.clamp(1, 50)),
      clearError: true,
    );
  }

  Future<bool> submitCheckout() async {
    final draft = state.draft;
    if (draft == null || draft.checkIn == null || draft.checkOut == null) {
      state = state.copyWith(error: 'Please select check-in and check-out dates.');
      return false;
    }

    if (!draft.checkOut!.isAfter(draft.checkIn!)) {
      state = state.copyWith(error: 'Check-out must be after check-in.');
      return false;
    }

    state = state.copyWith(isSubmitting: true, clearError: true);

    final checkIn = CheckoutDraft.formatDate(draft.checkIn!);
    final checkOut = CheckoutDraft.formatDate(draft.checkOut!);

    try {
      // Soft availability check (non-blocking if endpoint fails)
      try {
        bool available = true;
        switch (draft.serviceType) {
          case ManualServiceType.hotel:
            if (draft.roomId != null) {
              available = await _catalogApi.checkRoomAvailability(
                hotelId: draft.entityId,
                roomId: draft.roomId!,
                checkIn: checkIn,
                checkOut: checkOut,
              );
            }
            break;
          case ManualServiceType.tour:
            available = await _catalogApi.checkTourAvailability(
              packageId: draft.entityId,
              date: checkIn,
              guests: draft.guests,
            );
            break;
          case ManualServiceType.vehicle:
            available = await _catalogApi.checkVehicleAvailability(
              vehicleId: draft.entityId,
              startDate: checkIn,
              endDate: checkOut,
            );
            break;
        }
        if (!available) {
          state = state.copyWith(
            isSubmitting: false,
            error: 'Not available for the selected dates. Try different dates.',
          );
          return false;
        }
      } catch (_) {
        // Proceed to prepare; server will enforce holds.
      }

      final userId = _ref.read(userProvider).user?.id;
      final item = BookingItem(
        serviceType: draft.serviceTypeApi,
        entityId: draft.entityId,
        name: draft.name,
        priceEtb: draft.totalPrice,
        currency: draft.currency,
        roomId: draft.roomId,
        checkIn: checkIn,
        checkOut: checkOut,
      );

      final pending = await _bookingApi.prepare(
        items: [item],
        userId: userId,
      );

      final confirmed = await _bookingApi.confirm(bookingId: pending.id);

      final record = ManualBookingRecord.fromApi(
        confirmed,
        destinationId: draft.destinationId,
      );
      final history = [record, ...state.history];
      await _persistHistory(history);

      state = state.copyWith(
        isSubmitting: false,
        pendingBooking: pending,
        confirmedBooking: confirmed,
        history: history,
        clearDraft: true,
      );
      return true;
    } catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        error: e.toString(),
      );
      return false;
    }
  }

  void clearConfirmation() {
    state = state.copyWith(
      clearConfirmed: true,
      clearPending: true,
      clearError: true,
    );
  }

  Future<void> removeFromHistory(String bookingId) async {
    final history =
        state.history.where((b) => b.id != bookingId).toList();
    await _persistHistory(history);
    state = state.copyWith(history: history);
  }
}
