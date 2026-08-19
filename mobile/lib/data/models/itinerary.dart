class Itinerary {
  final List<ItineraryDay> days;

  Itinerary({required this.days});

  Map<String, dynamic> toJson() {
    return {
      'days': days.map((d) => d.toJson()).toList(),
    };
  }

  factory Itinerary.fromJson(Map<String, dynamic> json) {
    return Itinerary(
      days: (json['days'] as List)
          .map((d) => ItineraryDay.fromJson(d))
          .toList(),
    );
  }
}

class ItineraryDay {
  final int dayNumber;
  final String date;
  final List<ItineraryItem> items;

  ItineraryDay({
    required this.dayNumber,
    required this.date,
    required this.items,
  });

  Map<String, dynamic> toJson() {
    return {
      'dayNumber': dayNumber,
      'date': date,
      'items': items.map((i) => i.toJson()).toList(),
    };
  }

  factory ItineraryDay.fromJson(Map<String, dynamic> json) {
    return ItineraryDay(
      dayNumber: json['dayNumber'],
      date: json['date'],
      items: (json['items'] as List)
          .map((i) => ItineraryItem.fromJson(i))
          .toList(),
    );
  }
}

class ItineraryItem {
  final String time;
  final String activity;
  final String description;
  final String? location;
  final double? cost;
  final String? bookingId; // Link to booking if booked

  ItineraryItem({
    required this.time,
    required this.activity,
    required this.description,
    this.location,
    this.cost,
    this.bookingId,
  });

  Map<String, dynamic> toJson() {
    return {
      'time': time,
      'activity': activity,
      'description': description,
      'location': location,
      'cost': cost,
      'bookingId': bookingId,
    };
  }

  factory ItineraryItem.fromJson(Map<String, dynamic> json) {
    return ItineraryItem(
      time: json['time'],
      activity: json['activity'],
      description: json['description'],
      location: json['location'],
      cost: json['cost']?.toDouble(),
      bookingId: json['bookingId'],
    );
  }
}