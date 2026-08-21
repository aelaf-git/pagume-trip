import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'dart:io';

// --- PROVIDER ---
final chatProvider = StateNotifierProvider<ChatNotifier, ChatState>((ref) {
  return ChatNotifier();
});

// --- THREAD MODEL ---
class ChatThread {
  final String id;
  final String title;
  final List<ChatMessage> messages;
  final TripProposal? currentProposal;

  ChatThread({
    required this.id,
    required this.title,
    required this.messages,
    this.currentProposal,
  });

  ChatThread copyWith({
    String? id,
    String? title,
    List<ChatMessage>? messages,
    TripProposal? currentProposal,
  }) {
    return ChatThread(
      id: id ?? this.id,
      title: title ?? this.title,
      messages: messages ?? this.messages,
      currentProposal: currentProposal ?? this.currentProposal,
    );
  }
}

// --- STATE CLASS ---
class ChatState {
  final List<ChatMessage> messages;
  final bool isLoading;
  final bool isProcessing;
  final bool isConnected;
  final String? error;
  final TripProposal? currentProposal;
  final String? threadId;
  final List<ChatThread> threads;
  final List<TripProposal> savedTrips;

  ChatState({
    this.messages = const [],
    this.isLoading = false,
    this.isProcessing = false,
    this.isConnected = false,
    this.error,
    this.currentProposal,
    this.threadId,
    this.threads = const [],
    this.savedTrips = const [],
  });

  ChatState copyWith({
    List<ChatMessage>? messages,
    bool? isLoading,
    bool? isProcessing,
    bool? isConnected,
    String? error,
    TripProposal? currentProposal,
    String? threadId,
    List<ChatThread>? threads,
    List<TripProposal>? savedTrips,
  }) {
    return ChatState(
      messages: messages ?? this.messages,
      isLoading: isLoading ?? this.isLoading,
      isProcessing: isProcessing ?? this.isProcessing,
      isConnected: isConnected ?? this.isConnected,
      error: error ?? this.error,
      currentProposal: currentProposal ?? this.currentProposal,
      threadId: threadId ?? this.threadId,
      threads: threads ?? this.threads,
      savedTrips: savedTrips ?? this.savedTrips,
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
    _loadSavedTrips();
  }

  void _initThread() {
    final newThreadId = 'thread_${DateTime.now().millisecondsSinceEpoch}';
    final initialThread = ChatThread(
      id: newThreadId,
      title: 'New Chat',
      messages: [],
    );
    state = state.copyWith(
      threadId: newThreadId,
      threads: [initialThread],
    );
  }

  // --- PERSISTENCE LOGIC ---
  Future<void> _loadSavedTrips() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final String? tripsJson = prefs.getString('saved_trips');

      if (tripsJson != null) {
        final List<dynamic> decoded = jsonDecode(tripsJson);
        final List<TripProposal> loadedTrips =
            decoded.map((json) => TripProposal.fromJson(json)).toList();

        state = state.copyWith(savedTrips: loadedTrips);
      }
    } catch (e) {
      // Ignore persistence errors; app still works without saved trips.
    }
  }

  Future<void> _saveTripsToStorage(List<TripProposal> trips) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final List<Map<String, dynamic>> jsonList =
          trips.map((trip) => trip.toJson()).toList();
      await prefs.setString('saved_trips', jsonEncode(jsonList));
    } catch (e) {
      // Ignore persistence errors.
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

  Future<void> sendUserMessage(String text) async {
    final userMsg = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      text: text,
      isUser: true,
      timestamp: DateTime.now(),
      isActivity: false,
    );

    final threadId = state.threadId ?? 'thread_${DateTime.now().millisecondsSinceEpoch}';

    // Update threads list with new message and title if needed
    List<ChatThread> updatedThreads = state.threads;
    final activeThread = state.threads.firstWhere(
      (t) => t.id == threadId,
      orElse: () => ChatThread(id: threadId, title: 'New Chat', messages: []),
    );

    String newTitle = activeThread.title;
    if (activeThread.messages.isEmpty ||
        activeThread.title == 'New Chat' ||
        activeThread.title.startsWith('Chat ')) {
      newTitle = text.length > 25 ? '${text.substring(0, 22)}...' : text;
    }

    updatedThreads = state.threads.map((t) {
      if (t.id == threadId) {
        return ChatThread(
          id: t.id,
          title: newTitle,
          messages: [...state.messages, userMsg],
          currentProposal: t.currentProposal,
        );
      }
      return t;
    }).toList();

    state = state.copyWith(
      messages: [...state.messages, userMsg],
      isProcessing: true,
      error: null,
      threads: updatedThreads,
    );

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
          id: selectedOption['option_id'] ??
              DateTime.now().millisecondsSinceEpoch.toString(),
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
          id: pending['booking_id'] ??
              DateTime.now().millisecondsSinceEpoch.toString(),
          destination: 'Authorization Required',
          price: (pending['total_etb'] as num?)?.toDouble() ?? 0.0,
          currency: pending['currency'] ?? 'ETB',
          details: details,
          duration: 'N/A',
        );
      }

      final responseId = DateTime.now().millisecondsSinceEpoch.toString();
      state = state.copyWith(
        messages: [
          ...state.messages,
          ChatMessage(
            id: responseId,
            text: '',
            isUser: false,
            timestamp: DateTime.now(),
          ),
        ],
        currentProposal: proposal,
        isProcessing: false,
        threadId: threadId,
      );

      await _streamText(responseId, reply);
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
      threads: [
        ChatThread(id: newThreadId, title: 'New Chat', messages: []),
      ],
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

      final accepted = proposal.copyWith(status: 'accepted');
      final updatedTrips = List<TripProposal>.from(state.savedTrips)..add(accepted);
      await _saveTripsToStorage(updatedTrips);

      final responseId = DateTime.now().millisecondsSinceEpoch.toString();
      state = state.copyWith(
        messages: [
          ...state.messages,
          ChatMessage(
            id: responseId,
            text: '',
            isUser: false,
            timestamp: DateTime.now(),
          ),
        ],
        currentProposal: null,
        isProcessing: false,
        savedTrips: updatedTrips,
      );

      await _streamText(responseId, reply);
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

      final responseId = DateTime.now().millisecondsSinceEpoch.toString();
      state = state.copyWith(
        messages: [
          ...state.messages,
          ChatMessage(
            id: responseId,
            text: '',
            isUser: false,
            timestamp: DateTime.now(),
          ),
        ],
        currentProposal: null,
        isProcessing: false,
      );

      await _streamText(responseId, reply);
    } catch (e) {
      state = state.copyWith(
        isProcessing: false,
        error: 'Failed to decline booking: $e',
      );
    }
  }

  void cancelTrip(String tripId) {
    final updatedTrips =
        state.savedTrips.where((trip) => trip.id != tripId).toList();

    state = state.copyWith(
      savedTrips: updatedTrips,
    );

    _saveTripsToStorage(updatedTrips);

    addAIResponse(
      '❌ Trip cancelled successfully.\n\n'
      'No charges have been made. Feel free to book another adventure!',
      isActivity: false,
    );
  }

  Future<void> _streamText(String messageId, String fullText) async {
    final words = fullText.split(' ');
    String currentText = '';

    for (int i = 0; i < words.length; i++) {
      await Future.delayed(const Duration(milliseconds: 15));
      currentText += (i == 0 ? '' : ' ') + words[i];

      final updatedMessages = state.messages.map((m) {
        if (m.id == messageId) {
          return m.copyWith(text: currentText);
        }
        return m;
      }).toList();

      final updatedThreads = state.threads.map((t) {
        if (t.id == state.threadId) {
          return ChatThread(
            id: t.id,
            title: t.title,
            messages: updatedMessages,
            currentProposal: state.currentProposal,
          );
        }
        return t;
      }).toList();

      // Update the message and threads list in state
      state = state.copyWith(
        messages: updatedMessages,
        threads: updatedThreads,
      );
    }
  }

  void switchThread(String targetThreadId) {
    // 1. Save current active thread messages/proposal to threads list
    final updatedThreads = state.threads.map((t) {
      if (t.id == state.threadId) {
        return ChatThread(
          id: t.id,
          title: t.title,
          messages: state.messages,
          currentProposal: state.currentProposal,
        );
      }
      return t;
    }).toList();

    // 2. Find target thread
    final targetThread = updatedThreads.firstWhere(
      (t) => t.id == targetThreadId,
      orElse: () => ChatThread(id: targetThreadId, title: 'Chat', messages: []),
    );

    // 3. Update state
    state = state.copyWith(
      threads: updatedThreads,
      threadId: targetThreadId,
      messages: targetThread.messages,
      currentProposal: targetThread.currentProposal,
    );
  }

  void createNewThread() {
    // 1. Save current active thread messages/proposal first
    final updatedThreads = state.threads.map((t) {
      if (t.id == state.threadId) {
        return ChatThread(
          id: t.id,
          title: t.title,
          messages: state.messages,
          currentProposal: state.currentProposal,
        );
      }
      return t;
    }).toList();

    // 2. Create new thread
    final newThreadId = 'thread_${DateTime.now().millisecondsSinceEpoch}';
    final newThread = ChatThread(
      id: newThreadId,
      title: 'Chat ${updatedThreads.length + 1}',
      messages: [],
    );

    state = state.copyWith(
      threads: [...updatedThreads, newThread],
      threadId: newThreadId,
      messages: [],
      currentProposal: null,
    );
  }

  void deleteThread(String threadIdToDelete) {
    if (state.threads.length <= 1) return;

    final updatedThreads =
        state.threads.where((t) => t.id != threadIdToDelete).toList();

    String nextActiveId = state.threadId!;
    if (state.threadId == threadIdToDelete) {
      nextActiveId = updatedThreads.first.id;
    }

    final targetThread = updatedThreads.firstWhere((t) => t.id == nextActiveId);

    state = state.copyWith(
      threads: updatedThreads,
      threadId: nextActiveId,
      messages: targetThread.messages,
      currentProposal: targetThread.currentProposal,
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
