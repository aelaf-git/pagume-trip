import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:async';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

// --- PROVIDER ---
final chatProvider = StateNotifierProvider<ChatNotifier, ChatState>((ref) {
  return ChatNotifier();
});

// --- STATE CLASS ---
class ChatState {
  final List<ChatMessage> messages;
  final bool isLoading;
  final bool isProcessing;
  final bool isConnected;
  final String? error;
  final TripProposal? currentProposal;
  final List<TripProposal> savedTrips;

  ChatState({
    this.messages = const [],
    this.isLoading = false,
    this.isProcessing = false,
    this.isConnected = false,
    this.error,
    this.currentProposal,
    this.savedTrips = const [],
  });

  ChatState copyWith({
    List<ChatMessage>? messages,
    bool? isLoading,
    bool? isProcessing,
    bool? isConnected,
    String? error,
    TripProposal? currentProposal,
    List<TripProposal>? savedTrips,
  }) {
    return ChatState(
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      isProcessing: isProcessing ?? this.isProcessing,
      isConnected: isConnected ?? this.isConnected,
      error: error ?? this.error,
      currentProposal: currentProposal ?? this.currentProposal,
      savedTrips: savedTrips ?? this.savedTrips,
    );
  }
}

// --- NOTIFIER CLASS ---
class ChatNotifier extends StateNotifier<ChatState> {
  ChatNotifier() : super(ChatState()) {
    _loadSavedTrips(); // Load trips immediately when app starts
  }

  // --- PERSISTENCE LOGIC ---
  Future<void> _loadSavedTrips() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final String? tripsJson = prefs.getString('saved_trips');

      if (tripsJson != null) {
        final List<dynamic> decoded = jsonDecode(tripsJson);
        final List<TripProposal> loadedTrips = decoded.map((json) => TripProposal.fromJson(json)).toList();

        state = state.copyWith(savedTrips: loadedTrips);
      }
    } catch (e) {
      print('Error loading trips: $e');
    }
  }

  Future<void> _saveTripsToStorage(List<TripProposal> trips) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final List<Map<String, dynamic>> jsonList = trips.map((trip) => trip.toJson()).toList();
      await prefs.setString('saved_trips', jsonEncode(jsonList));
    } catch (e) {
      print('Error saving trips: $e');
    }
  }

  // --- MESSAGE METHODS ---

  void addAIResponse(String text, {bool isActivity = false, List<String>? steps}) {
    final newMessage = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      text: text,
      isUser: false,
      timestamp: DateTime.now(),
      isActivity: isActivity,
      steps: steps,
    );
    state = state.copyWith(
      messages: [...state.messages, newMessage],
    );
  }

  void addMessage(ChatMessage msg) {
    state = state.copyWith(
      messages: [...state.messages, msg],
    );
  }

  void sendUserMessage(String text) async {
    final userMsg = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      text: text,
      isUser: true,
      timestamp: DateTime.now(),
      isActivity: false,
    );
    state = state.copyWith(
      messages: [...state.messages, userMsg],
      isProcessing: true,
    );
    await Future.delayed(const Duration(seconds: 1));
    addAIResponse("I'm processing your request for '$text'...", isActivity: false);
    state = state.copyWith(isProcessing: false);
  }

  void updateMessage(String id, ChatMessage updatedMessage) {
    final updatedList = state.messages.map((msg) {
      if (msg.id == id) return updatedMessage;
      return msg;
    }).toList();
    state = state.copyWith(messages: updatedList);
  }

  void replaceMessages(List<ChatMessage> messages) {
    state = state.copyWith(messages: messages);
  }

  void clearMessages() {
    state = ChatState(
      messages: [],
      isLoading: false,
      isProcessing: false,
      isConnected: false,
      error: null,
      currentProposal: null,
      savedTrips: state.savedTrips,
    );
  }

  void setProcessing(bool processing) {
    state = state.copyWith(isProcessing: processing);
  }

  void setConnected(bool connected) {
    state = state.copyWith(isConnected: connected);
  }

  void setError(String error) {
    state = state.copyWith(error: error, isProcessing: false);
  }

  void clearError() {
    state = state.copyWith(error: null);
  }

  // --- PROPOSAL METHODS ---

  void setProposal(TripProposal proposal) {
    state = state.copyWith(currentProposal: proposal);
  }

  void acceptProposal() {
    if (state.currentProposal == null) return;
    final updated = state.currentProposal!.copyWith(status: 'accepted');

    final updatedTrips = List<TripProposal>.from(state.savedTrips)..add(updated);

    state = state.copyWith(
      currentProposal: updated,
      savedTrips: updatedTrips,
    );

    // SAVE TO STORAGE
    _saveTripsToStorage(updatedTrips);

    addAIResponse(
      '✅ Booking Confirmed! ✨ \n\n'
          'Your trip to ${updated.destination} has been booked!\n'
          '💰 Total: ${updated.price} ${updated.currency}\n'
          '📄 Details: ${updated.details}\n\n'
          'A confirmation email has been sent to your registered email.',
      isActivity: false,
    );
  }

  void declineProposal() {
    if (state.currentProposal == null) return;
    state = state.copyWith(currentProposal: null);
    addAIResponse(
      '❌ Booking declined. No charges have been made.\n\n'
          'Would you like me to suggest alternative options?',
      isActivity: false,
    );
  }

  void cancelTrip(String tripId) {
    final updatedTrips = state.savedTrips.where((trip) => trip.id != tripId).toList();

    state = state.copyWith(
      savedTrips: updatedTrips,
    );

    // SAVE TO STORAGE
    _saveTripsToStorage(updatedTrips);

    addAIResponse(
      '❌ Trip cancelled successfully.\n\n'
          'No charges have been made. Feel free to book another adventure!',
      isActivity: false,
    );
  }
}

// --- CHAT MESSAGE MODEL ---
class ChatMessage {
  final String id;
  final String text;
  final bool isUser;
  final DateTime timestamp;
  final bool isActivity;
  final List<String>? steps;

  ChatMessage({
    required this.id,
    required this.text,
    required this.isUser,
    required this.timestamp,
    this.isActivity = false,
    this.steps,
  });

  ChatMessage copyWith({
    String? id,
    String? text,
    bool? isUser,
    DateTime? timestamp,
    bool? isActivity,
    List<String>? steps,
  }) {
    return ChatMessage(
      id: id ?? this.id,
      text: text ?? this.text,
      isUser: isUser ?? this.isUser,
      timestamp: timestamp ?? this.timestamp,
      isActivity: isActivity ?? this.isActivity,
      steps: steps ?? this.steps,
    );
  }
}

// --- TRIP PROPOSAL MODEL (UPDATED FOR JSON) ---
class TripProposal {
  final String id;
  final String destination;
  final double price;
  final String currency;
  final String details;
  final String status;
  final String duration;

  TripProposal({
    required this.id,
    required this.destination,
    required this.price,
    required this.currency,
    required this.details,
    required this.duration,
    this.status = 'pending',
  });

  // Convert to JSON for storage
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'destination': destination,
      'price': price,
      'currency': currency,
      'details': details,
      'status': status,
      'duration': duration,
    };
  }

  // Create from JSON
  factory TripProposal.fromJson(Map<String, dynamic> json) {
    return TripProposal(
      id: json['id'],
      destination: json['destination'],
      price: (json['price'] as num).toDouble(),
      currency: json['currency'],
      details: json['details'],
      status: json['status'],
      duration: json['duration'],
    );
  }

  TripProposal copyWith({String? status}) {
    return TripProposal(
      id: id,
      destination: destination,
      price: price,
      currency: currency,
      details: details,
      status: status ?? this.status,
      duration: duration,
    );
  }
}