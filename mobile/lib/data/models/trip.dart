import 'booking.dart';
import 'itinerary.dart';

class Trip {
  final String id;
  final String destination;
  final DateTime startDate;
  final DateTime endDate;
  final int travelers;
  final double budget;
  final double estimatedCost;
  final String status; // 'planning', 'booked', 'in_progress', 'completed', 'cancelled'
  final List<Booking> bookings;
  final Itinerary itinerary;
  final Map<String, dynamic> preferences;

  Trip({
    required this.id,
    required this.destination,
    required this.startDate,
    required this.endDate,
    required this.travelers,
    required this.budget,
    required this.estimatedCost,
    required this.status,
    required this.bookings,
    required this.itinerary,
    required this.preferences,
  });

  // Convert Trip to JSON (for API)
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'destination': destination,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate.toIso8601String(),
      'travelers': travelers,
      'budget': budget,
      'estimatedCost': estimatedCost,
      'status': status,
      'bookings': bookings.map((b) => b.toJson()).toList(),
      'itinerary': itinerary.toJson(),
      'preferences': preferences,
    };
  }

  // Create Trip from JSON (from API)
  factory Trip.fromJson(Map<String, dynamic> json) {
    return Trip(
      id: json['id'],
      destination: json['destination'],
      startDate: DateTime.parse(json['startDate']),
      endDate: DateTime.parse(json['endDate']),
      travelers: json['travelers'],
      budget: json['budget'].toDouble(),
      estimatedCost: json['estimatedCost'].toDouble(),
      status: json['status'],
      bookings: (json['bookings'] as List)
          .map((b) => Booking.fromJson(b))
          .toList(),
      itinerary: Itinerary.fromJson(json['itinerary']),
      preferences: json['preferences'] ?? {},
    );
  }
}