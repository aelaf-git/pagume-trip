import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/providers/chat_provider.dart';
import '../../../core/providers/user_provider.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final TextEditingController _controller = TextEditingController();

  final List<String> _agentSteps = [
    '🎯 Understanding your objective...',
    '📍 Finding destinations...',
    '🏨 Searching accommodations...',
    '🚗 Finding transportation...',
    '🏛️ Finding activities...',
    '💰 Calculating budget...',
    '📅 Building itinerary...',
  ];

  @override
  Widget build(BuildContext context) {
    final chatState = ref.watch(chatProvider);
    final messages = chatState.messages;
    final proposal = chatState.currentProposal;
    final user = ref.watch(userProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          user.isAuthenticated
              ? 'Hi, Traveler!'
              : 'AI Travel Assistant',
        ),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.read(chatProvider.notifier).clearMessages();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: messages.isEmpty
                ? _buildEmptyState()
                : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: messages.length,
              itemBuilder: (context, index) {
                final message = messages[index];

                if (message.isActivity) {
                  return _buildActivityWidget(message);
                }

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildMessageBubble(
                      message.text,
                      message.isUser,
                    ),
                    if (!message.isUser &&
                        proposal != null &&
                        proposal.status == 'pending')
                      _buildTripProposalCard(),
                  ],
                );
              },
            ),
          ),
          _buildInputField(chatState.isProcessing),
        ],
      ),
    );
  }

  // ============================================================
  // EMPTY STATE
  // ============================================================

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.chat_bubble_outline,
            size: 80,
            color: Colors.grey,
          ),
          const SizedBox(height: 16),
          const Text(
            'Start Your Journey',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Tell me where you want to go,\nand I\'ll plan your perfect trip!',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey,
            ),
          ),
          const SizedBox(height: 24),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            alignment: WrapAlignment.center,
            children: [
              _buildQuickButton('Lalibela', Icons.hiking),
              _buildQuickButton('Gondar', Icons.castle),
              _buildQuickButton('Axum', Icons.history),
              _buildQuickButton('Gorgora', Icons.beach_access),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickButton(
      String destination,
      IconData icon,
      ) {
    return ElevatedButton.icon(
      onPressed: () {
        _sendMessage('I want to visit $destination');
      },
      icon: Icon(icon, size: 16),
      label: Text(destination),
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary.withOpacity(0.1),
        foregroundColor: AppColors.primary,
        padding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 10,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
      ),
    );
  }

  // ============================================================
  // SEND MESSAGE
  // ============================================================

  void _sendMessage(String text) async {
    if (text.trim().isEmpty) return;

    final chatNotifier = ref.read(chatProvider.notifier);

    // 1. Add user message.
    chatNotifier.sendUserMessage(text);

    // 2. Create ONE ID for the activity message.
    final activityId =
    DateTime.now().millisecondsSinceEpoch.toString();

    // 3. Add initial activity message
    chatNotifier.addAIResponse(
      '🔍 Pagume is planning your trip...',
      isActivity: true,
    );

    // 4. Update steps one by one.
    for (int i = 0; i < _agentSteps.length; i++) {
      await Future.delayed(
        const Duration(milliseconds: 500),
      );

      final updatedSteps = List<String>.from(
        _agentSteps,
      );

      for (int j = 0; j <= i; j++) {
        updatedSteps[j] = '✅ ${updatedSteps[j]}';
      }

      for (int j = i + 1; j < updatedSteps.length; j++) {
        updatedSteps[j] = '⏳ ${updatedSteps[j]}';
      }

      final updatedMessage = ChatMessage(
        id: activityId,
        text: '🔍 Pagume is planning your trip...',
        isUser: false,
        timestamp: DateTime.now(),
        isActivity: true,
        steps: updatedSteps,
      );

      chatNotifier.updateMessage(
        activityId,
        updatedMessage,
      );
    }

    // 5. Remove activity message while keeping the other messages.
    await Future.delayed(
      const Duration(milliseconds: 300),
    );

    final currentMessages =
    List<ChatMessage>.from(chatNotifier.state.messages);

    final remainingMessages = currentMessages
        .where((msg) => msg.id != activityId)
        .toList();

    chatNotifier.replaceMessages(remainingMessages);

    // 6. Add final AI response.
    final response = _getAIResponse(text);

    chatNotifier.addAIResponse(
      response,
      isActivity: false,
    );

    // 7. Create proposal if it's a destination request.
    final lowerText = text.toLowerCase();

    if (lowerText.contains('lalibela') ||
        lowerText.contains('gondar') ||
        lowerText.contains('axum') ||
        lowerText.contains('gorgora')) {
      _createTripProposal(text);
    }
  }

  // ============================================================
  // CREATE TRIP PROPOSAL
  // ============================================================

  void _createTripProposal(String userMessage) {
    final lowerMsg = userMessage.toLowerCase();

    String destination = 'Lalibela - 4 Day Cultural Tour';
    String duration = '4 Days';
    double price = 27000;
    String currency = 'ETB';
    String details =
        'Includes: Accommodation, Transport, Tour Guide, Activities';

    if (lowerMsg.contains('gondar')) {
      destination = 'Gondar - 3 Day Historical Tour';
      duration = '3 Days';
      price = 18000;
      details =
      'Includes: Accommodation, Transport, Castle Tour';
    } else if (lowerMsg.contains('axum')) {
      destination = 'Axum - 3 Day Ancient Tour';
      duration = '3 Days';
      price = 21000;
      details =
      'Includes: Accommodation, Transport, Historical Tour, Activities';
    } else if (lowerMsg.contains('gorgora')) {
      destination = 'Gorgora - 4 Day Lake Escape';
      duration = '4 Days';
      price = 44000;
      details =
      'Includes: Accommodation, Transport, Boat Trip, Activities';
    }

    final proposal = TripProposal(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      destination: destination,
      duration: duration,
      price: price,
      currency: currency,
      details: details,
    );

    ref.read(chatProvider.notifier).setProposal(proposal);
  }

  // ============================================================
  // AI RESPONSE LOGIC
  // ============================================================

  String _getAIResponse(String userMessage) {
    final lowerMsg = userMessage.toLowerCase();

    if (lowerMsg.contains('lalibela')) {
      return _buildLalibelaResponse();
    }

    if (lowerMsg.contains('gondar') ||
        lowerMsg.contains('castle')) {
      return _buildGondarResponse();
    }

    if (lowerMsg.contains('axum') ||
        lowerMsg.contains('stele')) {
      return _buildAxumResponse();
    }

    if (lowerMsg.contains('gorgora')) {
      return _buildGorgoraResponse();
    }

    if (lowerMsg.contains('budget') ||
        lowerMsg.contains('money')) {
      return _buildBudgetResponse();
    }

    if (lowerMsg.contains('hotel') ||
        lowerMsg.contains('stay') ||
        lowerMsg.contains('accommodation')) {
      return _buildAccommodationResponse();
    }

    if (lowerMsg.contains('hello') ||
        lowerMsg.contains('hi') ||
        lowerMsg.contains('hey')) {
      return _buildGreetingResponse();
    }

    return _buildDefaultResponse();
  }

  // ============================================================
  // RESPONSE BUILDERS (ALL ASTERISKS REMOVED)
  // ============================================================

  String _buildLalibelaResponse() {
    return '''
⛪ Lalibela Trip - 4 Days

🏨 Accommodation: Lalibela Lodge - 12,000 ETB (4.5 stars)
🚗 Transport: Private Car with Driver - 8,000 ETB
👨‍🏫 Tour Guide: Guided Church Tour - 4,000 ETB
🏛️ Activities: Rock Church Tours - 3,000 ETB

💰 Total: ~27,000 ETB

Would you like me to create this trip for you? 🎯
''';
  }

  String _buildGondarResponse() {
    return '''
🏰 Gondar Trip - 3 Days

🏨 Accommodation: Goha Hotel - 8,000 ETB (4.2 stars)
🚗 Transport: Private Car - 5,000 ETB
👨‍🏫 Tour Guide: Castle Tour - 3,000 ETB

💰 Total: ~18,000 ETB

Shall I proceed with the booking? 📋
''';
  }

  String _buildAxumResponse() {
    return '''
🗿 Axum Trip - 3 Days

🏨 Accommodation: Axum Hotel - 9,000 ETB (4.0 stars)
🚗 Transport: SUV with Driver - 6,000 ETB
👨‍🏫 Tour Guide: Historical Tour - 3,500 ETB
🏛️ Activities: Stele Field Tour - 2,500 ETB

💰 Total: ~21,000 ETB

Ready to explore ancient history? 🏛️
''';
  }

  String _buildGorgoraResponse() {
    return '''
🌅 Gorgora Trip - 4 Days

🏨 Accommodation: Gorgora Resort - 18,000 ETB
🚗 Transport: Private Minibus - 20,000 ETB
🚤 Activities: Boat Trip on Lake Tana - 6,000 ETB

💰 Total: ~44,000 ETB

📅 Itinerary:
Day 1: Travel → Check-in → Resort
Day 2: Boat trip → Lake Tana exploration
Day 3: Cultural activities → Relaxation
Day 4: Breakfast → Check-out → Return

Ready to book? 🚀
''';
  }

  String _buildBudgetResponse() {
    return '''
💰 Budget Analysis

Your Lalibela trip:
• Accommodation: 12,000 ETB
• Transportation: 8,000 ETB
• Tour Guide: 4,000 ETB
• Activities: 3,000 ETB
• Total: 27,000 ETB

✅ Within your budget

Would you like to optimize this itinerary? 🔄
''';
  }

  String _buildAccommodationResponse() {
    return '''
🏨 Accommodation Options

1. Lalibela Lodge - 4.5 stars - 12,000 ETB
2. Maribela Hotel - 4.2 stars - 10,000 ETB
3. Tukul Village - 4.0 stars - 8,000 ETB

Which one interests you? 🏠
''';
  }

  String _buildGreetingResponse() {
    return '''
👋 Welcome to Pagume Trip!

I'm your AI Travel Assistant. I can help you:
• 🌍 Discover Ethiopian destinations
• 📅 Plan your perfect itinerary
• 🏨 Find verified accommodations
• 🚗 Arrange transportation
• 💰 Manage your budget

Try saying:
"I want to visit Lalibela for 4 days with a budget of 40,000 ETB"

Ready to start your journey? ✈️
''';
  }

  String _buildDefaultResponse() {
    return '''
🤔 I understand you're interested in Ethiopian travel!

📋 Try asking me about:
• Destinations: Lalibela, Gondar, Axum, Gorgora
• Budget: "I have a budget of 40,000 ETB"
• Duration: "I want to visit for 4 days"
• Activities: "I want a guided tour"
• Accommodation: "I want a comfortable hotel"

What would you like to know? 🗺️
''';
  }

  // ============================================================
  // ACTIVITY WIDGET
  // ============================================================

  Widget _buildActivityWidget(ChatMessage message) {
    final steps = message.steps ?? [];

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.primary.withOpacity(0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            message.text,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 8),
          ...steps.map(
                (step) => Padding(
              padding: const EdgeInsets.symmetric(
                vertical: 2,
              ),
              child: Text(
                step,
                style: TextStyle(
                  fontSize: 13,
                  color: step.startsWith('✅')
                      ? Colors.green
                      : Colors.grey,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ============================================================
  // MESSAGE BUBBLE
  // ============================================================

  Widget _buildMessageBubble(
      String text,
      bool isUser,
      ) {
    return Align(
      alignment: isUser
          ? Alignment.centerRight
          : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 10,
        ),
        decoration: BoxDecoration(
          color: isUser
              ? AppColors.primary
              : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: isUser
                ? const Radius.circular(16)
                : Radius.zero,
            bottomRight: isUser
                ? Radius.zero
                : const Radius.circular(16),
          ),
          border: isUser
              ? null
              : Border.all(
            color: AppColors.grey200,
          ),
        ),
        constraints: BoxConstraints(
          maxWidth:
          MediaQuery.of(context).size.width * 0.75,
        ),
        child: Text(
          text,
          style: TextStyle(
            color: isUser
                ? Colors.white
                : Colors.black87,
            height: 1.5,
          ),
        ),
      ),
    );
  }

  // ============================================================
  // INPUT FIELD
  // ============================================================

  Widget _buildInputField(bool isProcessing) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: TextField(
              controller: _controller,
              enabled: !isProcessing,
              decoration: InputDecoration(
                hintText: isProcessing
                    ? 'Processing...'
                    : 'Ask me about Ethiopia...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(25),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: AppColors.grey100,
                contentPadding:
                const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 8,
                ),
              ),
              onSubmitted: (text) {
                _sendMessage(text);
                _controller.clear();
              },
            ),
          ),
          const SizedBox(width: 8),
          CircleAvatar(
            backgroundColor: isProcessing
                ? AppColors.grey500
                : AppColors.primary,
            child: IconButton(
              icon: Icon(
                isProcessing
                    ? Icons.hourglass_empty
                    : Icons.send,
                color: Colors.white,
              ),
              onPressed: isProcessing
                  ? null
                  : () {
                if (_controller.text
                    .isNotEmpty) {
                  _sendMessage(
                    _controller.text,
                  );
                  _controller.clear();
                }
              },
            ),
          ),
        ],
      ),
    );
  }

  // ============================================================
  // TRIP PROPOSAL CARD
  // ============================================================

  Widget _buildTripProposalCard() {
    final proposal =
        ref.watch(chatProvider).currentProposal;

    if (proposal == null ||
        proposal.status != 'pending') {
      return const SizedBox.shrink();
    }

    return Container(
      margin: const EdgeInsets.only(
        top: 8,
        bottom: 12,
      ),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color:
          AppColors.primary.withOpacity(0.3),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment:
        CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding:
                const EdgeInsets.symmetric(
                  horizontal: 8,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color:
                  AppColors.accent.withOpacity(0.2),
                  borderRadius:
                  BorderRadius.circular(4),
                ),
                child: Text(
                  proposal.duration,
                  style: TextStyle(
                    color: AppColors.accentDark,
                    fontSize: 12,
                    fontWeight:
                    FontWeight.w600,
                  ),
                ),
              ),
              const Spacer(),
              Text(
                '${proposal.price} ${proposal.currency}',
                style: TextStyle(
                  color: AppColors.primary,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            proposal.destination,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            proposal.details,
            style: TextStyle(
              fontSize: 14,
              color: AppColors.grey600,
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    ref
                        .read(chatProvider.notifier)
                        .declineProposal();
                  },
                  style:
                  OutlinedButton.styleFrom(
                    foregroundColor: Colors.red,
                    side: const BorderSide(
                      color: Colors.red,
                    ),
                    shape:
                    RoundedRectangleBorder(
                      borderRadius:
                      BorderRadius.circular(8),
                    ),
                  ),
                  child:
                  const Text('Decline ❌'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    _showBookingConfirmationDialog();
                  },
                  style:
                  ElevatedButton.styleFrom(
                    backgroundColor:
                    AppColors.primary,
                    foregroundColor: Colors.white,
                    shape:
                    RoundedRectangleBorder(
                      borderRadius:
                      BorderRadius.circular(8),
                    ),
                  ),
                  child:
                  const Text('Book Now ✅'),
                ),
              ),
            ],
          ),
          Padding(
            padding:
            const EdgeInsets.only(top: 8),
            child: Text(
              '🔒 You will be asked to confirm this booking before payment is processed.',
              style: TextStyle(
                fontSize: 11,
                color: AppColors.grey500,
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ============================================================
  // BOOKING CONFIRMATION DIALOG
  // ============================================================

  void _showBookingConfirmationDialog() {
    final proposal =
        ref.read(chatProvider).currentProposal;

    if (proposal == null) return;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Confirm Booking'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment:
          CrossAxisAlignment.start,
          children: [
            const Text(
              'Please confirm your booking details:',
            ),
            const SizedBox(height: 12),
            _buildConfirmationRow(
              'Destination',
              proposal.destination,
            ),
            _buildConfirmationRow(
              'Duration',
              proposal.duration,
            ),
            _buildConfirmationRow(
              'Total',
              '${proposal.price} ${proposal.currency}',
              isBold: true,
            ),
            const SizedBox(height: 12),
            const Text(
              'By confirming, you authorize Pagume to charge this amount.',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
            },
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ref
                  .read(chatProvider.notifier)
                  .acceptProposal();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor:
              AppColors.primary,
              foregroundColor: Colors.white,
            ),
            child:
            const Text('Confirm & Book ✅'),
          ),
        ],
      ),
    );
  }

  Widget _buildConfirmationRow(
      String label,
      String value, {
        bool isBold = false,
      }) {
    return Padding(
      padding:
      const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment:
        MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontWeight: isBold
                  ? FontWeight.bold
                  : FontWeight.normal,
            ),
          ),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: TextStyle(
                fontWeight: isBold
                    ? FontWeight.bold
                    : FontWeight.normal,
                color:
                isBold ? AppColors.primary : null,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}