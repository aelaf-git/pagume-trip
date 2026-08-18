import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/models/trip.dart';

class TripState {
  final List<Trip> trips;
  final Trip? currentTrip;
  final bool isLoading;
  final String? error;

  TripState({
    this.trips = const [],
    this.currentTrip,
    this.isLoading = false,
    this.error,
  });

  TripState copyWith({
    List<Trip>? trips,
    Trip? currentTrip,
    bool? isLoading,
    String? error,
  }) {
    return TripState(
      trips: trips ?? this.trips,
      currentTrip: currentTrip ?? this.currentTrip,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }
}

final tripProvider = StateNotifierProvider<TripNotifier, TripState>((ref) {
  return TripNotifier();
});

class TripNotifier extends StateNotifier<TripState> {
  TripNotifier() : super(TripState());

  void setLoading(bool loading) {
    state = state.copyWith(isLoading: loading);
  }

  void loadTrips(List<Trip> trips) {
    state = state.copyWith(
      trips: trips,
      isLoading: false,
      error: null,
    );
  }

  void addTrip(Trip trip) {
    state = state.copyWith(
      trips: [...state.trips, trip],
      error: null,
    );
  }

  void selectTrip(Trip trip) {
    state = state.copyWith(currentTrip: trip);
  }

  void clearCurrentTrip() {
    state = state.copyWith(currentTrip: null);
  }

  void updateTrip(Trip updatedTrip) {
    final updatedTrips = state.trips.map((trip) {
      return trip.id == updatedTrip.id ? updatedTrip : trip;
    }).toList();

    state = state.copyWith(
      trips: updatedTrips,
      currentTrip: state.currentTrip?.id == updatedTrip.id
          ? updatedTrip
          : state.currentTrip,
    );
  }

  void deleteTrip(String tripId) {
    final updatedTrips = state.trips.where((trip) => trip.id != tripId).toList();
    state = state.copyWith(
      trips: updatedTrips,
      currentTrip: state.currentTrip?.id == tripId ? null : state.currentTrip,
    );
  }

  void setError(String error) {
    state = state.copyWith(error: error, isLoading: false);
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}