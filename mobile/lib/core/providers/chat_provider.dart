import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'dart:io';

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
  final String? threadId;

  ChatState({
    this.messages = const [],
    this.isLoading = false,
    this.isProcessing = false,
    this.isConnected = false,
    this.error,
    this.currentProposal,
    this.threadId,
  });

  ChatState copyWith({
    List<ChatMessage>? messages,
    bool? isLoading,
    bool? isProcessing,
    bool? isConnected,
    String? error,
    TripProposal? currentProposal,
    String? threadId,
  }) {
    return ChatState(
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      isProcessing: isProcessing ?? this.isProcessing,
      isConnected: isConnected ?? this.isConnected,
      error: error ?? this.error,
      currentProposal: currentProposal ?? this.currentProposal,
      threadId: threadId ?? this.threadId,
    );
  }
}

// --- NOTIFIER CLASS ---
class ChatNotifier extends StateNotifier<ChatState> {
  final Dio _dio = Dio();

  // Point to local machine's Agent API.
  // Using 10.0.2.2 for Android emulator, otherwise localhost/127.0.0.1.
  String get _baseUrl {
    try {
      if (Platform.isAndroid) {
        return 'http://10.0.2.2:8100';
      }
    } catch (_) {}
    return 'http://127.0.0.1:8100';
  }

  ChatNotifier() : super(ChatState()) {
    _initThread();
  }

  void _initThread() {
    final newThreadId = 'thread_${DateTime.now().millisecondsSinceEpoch}';
    state = state.copyWith(threadId: newThreadId);
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

  Future<void> sendUserMessage(String text) async {
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
      error: null,
    );

    final threadId = state.threadId ?? 'thread_${DateTime.now().millisecondsSinceEpoch}';

    try {
      final response = await _dio.post(
        '$_baseUrl/v1/runs',
        data: {
          'thread_id': threadId,
          'message': text,
          'reset': false,
        },
      );

      final data = response.data;
      String? reply = data['message'];

      // Fallback: if message is null, check public messages list
      if (reply == null || reply.isEmpty) {
        final msgs = data['messages'] as List?;
        if (msgs != null && msgs.isNotEmpty) {
          final lastMsg = msgs.last;
          if (lastMsg['role'] == 'assistant') {
            reply = lastMsg['content'];
          }
        }
      }

      reply ??= "I've processed your request.";

      // Handle proposed options
      TripProposal? proposal;
      final selectedOption = data['selected_option'];
      if (selectedOption != null) {
        final items = selectedOption['items'] as List?;
        final details = items != null
            ? 'Includes: ${items.map((i) => i['name']).join(', ')}'
            : 'Custom planned itinerary';
        proposal = TripProposal(
          id: selectedOption['option_id'] ?? DateTime.now().millisecondsSinceEpoch.toString(),
          destination: selectedOption['label'] ?? 'Custom Proposal',
          price: (selectedOption['total_etb'] as num?)?.toDouble() ?? 0.0,
          currency: 'ETB',
          details: details,
          duration: 'Dynamic',
        );
      }

      // Handle pending approval (interrupt)
      final pending = data['pending_approval'];
      if (pending != null) {
        final items = pending['items'] as List?;
        final details = items != null
            ? 'Confirming booking for: ${items.map((i) => i['name']).join(', ')}'
            : 'Booking approval request';
        proposal = TripProposal(
          id: pending['booking_id'] ?? DateTime.now().millisecondsSinceEpoch.toString(),
          destination: 'Authorization Required',
          price: (pending['total_etb'] as num?)?.toDouble() ?? 0.0,
          currency: pending['currency'] ?? 'ETB',
          details: details,
          duration: 'N/A',
        );
      }

      state = state.copyWith(
        messages: [
          ...state.messages,
          ChatMessage(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            text: reply,
            isUser: false,
            timestamp: DateTime.now(),
          ),
        ],
        currentProposal: proposal,
        isProcessing: false,
        threadId: threadId,
      );
    } catch (e) {
      state = state.copyWith(
        isProcessing: false,
        error: 'Failed to communicate with AI Assistant: $e',
      );
    }
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
    final newThreadId = 'thread_${DateTime.now().millisecondsSinceEpoch}';
    state = ChatState(
      messages: [],
      isLoading: false,
      isProcessing: false,
      isConnected: false,
      error: null,
      currentProposal: null,
      threadId: newThreadId,
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

  Future<void> acceptProposal() async {
    final proposal = state.currentProposal;
    final threadId = state.threadId;
    if (proposal == null || threadId == null) return;

    state = state.copyWith(isProcessing: true, error: null);

    try {
      final response = await _dio.post(
        '$_baseUrl/v1/runs/$threadId/approve',
        data: {
          'approved': true,
          'spending_cap_etb': proposal.price,
        },
      );

      final data = response.data;
      String? reply = data['message'];

      if (reply == null || reply.isEmpty) {
        final msgs = data['messages'] as List?;
        if (msgs != null && msgs.isNotEmpty) {
          final lastMsg = msgs.last;
          if (lastMsg['role'] == 'assistant') {
            reply = lastMsg['content'];
          }
        }
      }

      reply ??= "Booking confirmed successfully.";

      state = state.copyWith(
        messages: [
          ...state.messages,
          ChatMessage(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            text: reply,
            isUser: false,
            timestamp: DateTime.now(),
          ),
        ],
        currentProposal: null,
        isProcessing: false,
      );
    } catch (e) {
      state = state.copyWith(
        isProcessing: false,
        error: 'Failed to confirm booking: $e',
      );
    }
  }

  Future<void> declineProposal() async {
    final threadId = state.threadId;
    if (threadId == null) return;

    state = state.copyWith(isProcessing: true, error: null);

    try {
      final response = await _dio.post(
        '$_baseUrl/v1/runs/$threadId/approve',
        data: {
          'approved': false,
        },
      );

      final data = response.data;
      String? reply = data['message'];

      if (reply == null || reply.isEmpty) {
        final msgs = data['messages'] as List?;
        if (msgs != null && msgs.isNotEmpty) {
          final lastMsg = msgs.last;
          if (lastMsg['role'] == 'assistant') {
            reply = lastMsg['content'];
          }
        }
      }

      reply ??= "Booking declined.";

      state = state.copyWith(
        messages: [
          ...state.messages,
          ChatMessage(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            text: reply,
            isUser: false,
            timestamp: DateTime.now(),
          ),
        ],
        currentProposal: null,
        isProcessing: false,
      );
    } catch (e) {
      state = state.copyWith(
        isProcessing: false,
        error: 'Failed to decline booking: $e',
      );
    }
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