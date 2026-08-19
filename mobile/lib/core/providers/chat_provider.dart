import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'dart:async';

// ============================================================
// PROVIDER
// ============================================================

final chatProvider = StateNotifierProvider<ChatNotifier, ChatState>((ref) {
  return ChatNotifier();
});

// ============================================================
// STATE CLASS
// ============================================================

class ChatState {
  final List<ChatMessage> messages;
  final bool isLoading;
  final bool isProcessing;
  final TripProposal? currentProposal;

  ChatState({
    this.messages = const [],
    this.isLoading = false,
    this.isProcessing = false,
    this.currentProposal,
  });

  ChatState copyWith({
    List<ChatMessage>? messages,
    bool? isLoading,
    bool? isProcessing,
    TripProposal? currentProposal,
  }) {
    return ChatState(
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      isProcessing: isProcessing ?? this.isProcessing,
      currentProposal: currentProposal ?? this.currentProposal,
    );
  }
}

// ============================================================
// NOTIFIER CLASS
// ============================================================

class ChatNotifier extends StateNotifier<ChatState> {
  ChatNotifier() : super(ChatState());

  // ==========================================================
  // MESSAGE METHODS
  // ==========================================================

  // Add an AI response.
  //
  // steps and id are optional so normal AI messages still work,
  // while activity messages can contain progress steps and use
  // a specific ID for later updates.
  void addAIResponse(
      String text, {
        bool isActivity = false,
        List<String>? steps,
        String? id,
      }) {
    final newMessage = ChatMessage(
      id: id ?? DateTime.now().millisecondsSinceEpoch.toString(),
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

  // Add an existing message.
  void addMessage(ChatMessage msg) {
    state = state.copyWith(
      messages: [...state.messages, msg],
    );
  }

  // Send a user message.
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

    // Simulate AI processing delay.
    await Future.delayed(const Duration(seconds: 1));

    addAIResponse(
      "I'm processing your request for '$text'...",
      isActivity: false,
    );

    state = state.copyWith(
      isProcessing: false,
    );
  }

  // Update an existing message by ID.
  void updateMessage(String id, ChatMessage updatedMessage) {
    final updatedList = state.messages.map((msg) {
      if (msg.id == id) {
        return updatedMessage;
      }

      return msg;
    }).toList();

    state = state.copyWith(
      messages: updatedList,
    );
  }void replaceMessages(List<ChatMessage> messages) {
    state = state.copyWith(
      messages: messages,
    );
  }
  // Clear all messages.
  void clearMessages() {
    state = ChatState(
      messages: [],
      isLoading: false,
      isProcessing: false,
      currentProposal: null,
    );
  }

  // ==========================================================
  // PROPOSAL METHODS
  // ==========================================================

  void setProposal(TripProposal proposal) {
    state = state.copyWith(
      currentProposal: proposal,
    );
  }

  void acceptProposal() {
    if (state.currentProposal == null) return;

    final updated = state.currentProposal!.copyWith(
      status: 'accepted',
    );

    state = state.copyWith(
      currentProposal: updated,
    );

    addAIResponse(
      '✅ **Booking Confirmed!** ✨ \n\n'
          'Your trip to ${updated.destination} has been booked.\n'
          '💰 Total: \$${updated.price} ${updated.currency}\n'
          '📄 Details: ${updated.details}\n\n'
          'A confirmation email has been sent to your registered email.',
      isActivity: false,
    );
  }

  void declineProposal() {
    if (state.currentProposal == null) return;

    state = state.copyWith(
      currentProposal: null,
    );

    addAIResponse(
      '❌ **Booking declined.** No charges have been made.\n\n'
          'Would you like me to suggest alternative options?',
      isActivity: false,
    );
  }
}

// ============================================================
// CHAT MESSAGE MODEL
// ============================================================

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
    String? text,
    bool? isUser,
    DateTime? timestamp,
    bool? isActivity,
    List<String>? steps,
  }) {
    return ChatMessage(
      id: id,
      text: text ?? this.text,
      isUser: isUser ?? this.isUser,
      timestamp: timestamp ?? this.timestamp,
      isActivity: isActivity ?? this.isActivity,
      steps: steps ?? this.steps,
    );
  }
}

// ============================================================
// TRIP PROPOSAL MODEL
// ============================================================

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

  TripProposal copyWith({
    String? status,
  }) {
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