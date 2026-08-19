import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:async';

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

  ChatState({
    this.messages = const [],
    this.isLoading = false,
    this.isProcessing = false,
    this.isConnected = false,
    this.error,
    this.currentProposal,
  });

  ChatState copyWith({
    List<ChatMessage>? messages,
    bool? isLoading,
    bool? isProcessing,
    bool? isConnected,
    String? error,
    TripProposal? currentProposal,
  }) {
    return ChatState(
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      isProcessing: isProcessing ?? this.isProcessing,
      isConnected: isConnected ?? this.isConnected,
      error: error ?? this.error,
      currentProposal: currentProposal ?? this.currentProposal,
    );
  }
}

// --- NOTIFIER CLASS ---
class ChatNotifier extends StateNotifier<ChatState> {
  ChatNotifier() : super(ChatState());

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
    // 1. Add the user's message to the chat
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

    // 2. Extract destination
    String destination = "Addis Ababa, Ethiopia"; // CHANGED DEFAULT TO ETHIOPIA

    if (text.toLowerCase().contains("to ")) {
      String extracted = text.substring(text.toLowerCase().indexOf("to ") + 3).trim();
      // Capitalize the first letter
      extracted = extracted[0].toUpperCase() + extracted.substring(1);

      // If they typed a specific city, use it.
      destination = extracted + ", Ethiopia";
    }

    // 3. Simulate AI "thinking"
    await Future.delayed(const Duration(milliseconds: 500));
    addAIResponse('⏳ Searching for the best trips matching "$destination"...', isActivity: true, steps: ['🔍 Scanning destinations...']);

    await Future.delayed(const Duration(milliseconds: 800));
    addAIResponse('⏳ Checking availability and prices...', isActivity: true, steps: ['📊 Comparing flight costs...']);

    await Future.delayed(const Duration(milliseconds: 800));

    // 4. Send the Dynamic Trip Proposal
    final fakeProposal = TripProposal(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      destination: destination,
      price: 250.00, // Changed price to be a bit cheaper for local travel
      currency: "ETB", // CHANGED CURRENCY TO ETHIOPIAN BIRR
      details: "5-day cultural tour with visits to historical sites and local cuisine.",
      duration: "5 Days / 4 Nights",
      status: 'pending',
    );

    setProposal(fakeProposal);

    // 5. Send the final message
    addAIResponse(
      '✅ I found a great match for you!\n\n'
          '📍 Destination: ${fakeProposal.destination}\n'
          '⏳ Duration: ${fakeProposal.duration}\n'
          '💰 Total Price: ${fakeProposal.price} ${fakeProposal.currency}\n\n'
          'Would you like to book this trip?',
      isActivity: false,
    );

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
    state = state.copyWith(currentProposal: updated);
    addAIResponse(
      '✅ Booking Confirmed! ✨ \n\n'
          'Your trip to ${updated.destination} has been booked!\n'
          '💰 Total: \$${updated.price} ${updated.currency}\n'
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

// --- TRIP PROPOSAL MODEL ---
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