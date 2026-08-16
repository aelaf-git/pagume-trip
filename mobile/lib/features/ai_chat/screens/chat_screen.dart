import 'package:flutter/material.dart';
import '../../../data/models/trip.dart';
import '../../../data/models/booking.dart';
import '../../../data/models/itinerary.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _controller = TextEditingController();
  final List<Map<String, dynamic>> _messages = [];
  bool _isProcessing = false;
  List<Trip> _createdTrips = [];

  // Agent steps for FRS Section 36
  final List<String> _agentSteps = [
    '🎯 Understanding your objective...',
    '📍 Finding destinations...',
    '🏨 Searching accommodations...',
    '🚗 Finding transportation...',
    '🏛️ Finding activities...',
    '💰 Calculating budget...',
    '📅 Building itinerary...',
  ];

  // ============================================
  // SEND MESSAGE (Main AI Logic)
  // ============================================
  void _sendMessage(String text) async {
    if (text.trim().isEmpty || _isProcessing) return;

    // Add user message
    setState(() {
      _messages.add({'text': text, 'isUser': true});
      _isProcessing = true;
    });

    // Show agent activity (FRS Section 36)
    final activityId = DateTime.now().millisecondsSinceEpoch.toString();
    setState(() {
      _messages.add({
        'text': '🔍 Pagume is planning your trip...',
        'isUser': false,
        'isActivity': true,
        'activityId': activityId,
        'steps': _agentSteps.map((step) => '⏳ $step').toList(),
      });
    });

    // Simulate agent processing
    for (int i = 0; i < _agentSteps.length; i++) {
      await Future.delayed(const Duration(milliseconds: 500));
      if (mounted) {
        setState(() {
          final index = _messages.indexWhere(
                (msg) => msg['activityId'] == activityId,
          );
          if (index != -1) {
            final steps = List<String>.from(_messages[index]['steps']);
            steps[i] = steps[i].replaceFirst('⏳', '✅');
            _messages[index]['steps'] = steps;
          }
        });
      }
    }

    // Remove activity and show final response
    await Future.delayed(const Duration(milliseconds: 300));
    if (mounted) {
      setState(() {
        _messages.removeWhere((msg) => msg['activityId'] == activityId);
        _messages.add({
          'text': _getAIResponse(text),
          'isUser': false,
          'isAgent': true,
        });
        _isProcessing = false;
      });
    }
  }

  // ============================================
  // AI RESPONSE LOGIC
  // ============================================
  String _getAIResponse(String userMessage) {
    final lowerMsg = userMessage.toLowerCase();

    // Check for Lalibela
    if (lowerMsg.contains('lalibela')) {
      return _buildLalibelaResponse();
    }

    // Check for Gondar
    if (lowerMsg.contains('gondar') || lowerMsg.contains('castle')) {
      return _buildGondarResponse();
    }

    // Check for Axum
    if (lowerMsg.contains('axum') || lowerMsg.contains('stele')) {
      return _buildAxumResponse();
    }

    // Check for Gorgora
    if (lowerMsg.contains('gorgora')) {
      return _buildGorgoraResponse();
    }

    // Check for budget
    if (lowerMsg.contains('budget') || lowerMsg.contains('money')) {
      return _buildBudgetResponse();
    }

    // Check for hotel/accommodation
    if (lowerMsg.contains('hotel') || lowerMsg.contains('stay') || lowerMsg.contains('accommodation')) {
      return _buildAccommodationResponse();
    }

    // Check for activities
    if (lowerMsg.contains('activity') || lowerMsg.contains('tour') || lowerMsg.contains('experience')) {
      return _buildActivityResponse();
    }

    // Greeting
    if (lowerMsg.contains('hello') || lowerMsg.contains('hi') || lowerMsg.contains('hey')) {
      return _buildGreetingResponse();
    }

    // Default - No hallucination (FRS Section 25)
    return _buildDefaultResponse();
  }

  // ============================================
  // RESPONSE BUILDERS
  // ============================================

  // Lalibela Response (FRS Page 2)
  String _buildLalibelaResponse() {
    return '''
⛪ Lalibela Trip - 4 Days

✅ Destination: Lalibela (UNESCO World Heritage Site)

🏨 Accommodation Agent:
• Lalibela Lodge - 12,000 ETB ⭐ 4.5
• Maribela Hotel - 10,000 ETB ⭐ 4.2

🚗 Transportation Agent:
• Private Car with Driver - 8,000 ETB
• Minibus - 6,000 ETB

👨‍🏫 **Tour Agency Agent:
• Guided Church Tour - 4,000 ETB
• Historical Walking Tour - 3,000 ETB

🏛️ Activity Agent:
• Rock Church Tours - 3,000 ETB
• Mountain Hiking - 1,500 ETB

💰 Budget Agent:Total: ~27,000 ETB

---
Would you like me to create a trip for you?
''';
  }

  // Gondar Response
  String _buildGondarResponse() {
    return '''
🏰 **Gondar Trip - 3 Days**

✅ **Destination:** Gondar ("Camelot of Africa")

🏨 **Accommodation Agent:**
• Goha Hotel - 8,000 ETB ⭐ 4.2
• Gondar Hills Resort - 10,000 ETB ⭐ 4.0

🚗 **Transportation Agent:**
• Private Car - 5,000 ETB
• Minibus - 4,000 ETB

👨‍🏫 **Tour Agency Agent:**
• Castle Tour - 3,000 ETB
• Fasil Ghebbi Tour - 2,500 ETB

💰 **Budget Agent:** Total: ~18,000 ETB

---
Shall I proceed with the booking? 📋
''';
  }

  // Axum Response
  String _buildAxumResponse() {
    return '''
🗿 **Axum Trip - 3 Days**

✅ **Destination:** Axum (Ancient Axumite Empire)

🏨 **Accommodation Agent:**
• Axum Hotel - 9,000 ETB ⭐ 4.0
• Sabean Hotel - 8,000 ETB ⭐ 3.8

🚗 **Transportation Agent:**
• SUV with Driver - 6,000 ETB
• Minibus - 4,500 ETB

👨‍🏫 **Tour Agency Agent:**
• Historical Tour - 3,500 ETB
• Archaeological Tour - 3,000 ETB

🏛️ **Activity Agent:**
• Stele Field Tour - 2,500 ETB
• Queen of Sheba Tour - 2,000 ETB

💰 **Budget Agent:** Total: ~21,000 ETB

---
Ready to explore ancient history? 🏛️
''';
  }

  // Gorgora Response (FRS Section 49)
  String _buildGorgoraResponse() {
    return '''
🌅 **Gorgora Trip - 4 Days**

✅ **Destination:** Gorgora
👨‍👩‍👧‍👦 **Travelers:** 6 people
💰 **Budget:** 60,000 ETB

🏨 **Accommodation Agent:**
• Gorgora Resort - 18,000 ETB
• Lake View Lodge - 15,000 ETB

🚗 **Transportation Agent:**
• Private Minibus - 20,000 ETB
• SUV with Driver - 18,000 ETB

🚤 **Activity Agent:**
• Boat Trip on Lake Tana - 6,000 ETB
• Historical Tour - 4,000 ETB

💰 **Budget Agent:** Total: ~44,000 ETB

📅 **Itinerary Agent:**
Day 1: Travel → Check-in → Resort
Day 2: Boat trip → Lake Tana exploration
Day 3: Cultural activities → Relaxation
Day 4: Breakfast → Check-out → Return

---
Would you like me to create this trip for you?
''';
  }

  // Budget Agent (FRS Section 7.8)
  String _buildBudgetResponse() {
    return '''
💰 **Budget Analysis**

Your trip to Lalibela:
• Accommodation: 12,000 ETB
• Transportation: 8,000 ETB
• Tour Guide: 4,000 ETB
• Activities: 3,000 ETB
• **Total: 27,000 ETB**

✅ Within your budget

💡 **Recommendation:** Consider adding:
• Coffee ceremony experience: +800 ETB
• Local dinner experience: +1,200 ETB

Would you like me to optimize this itinerary? 🔄
''';
  }

  // Accommodation Agent (FRS Section 7.3)
  String _buildAccommodationResponse() {
    return '''
🏨 **Accommodation Options**

Verified properties from Pagume database:

1. **Lalibela Lodge** ⭐ 4.5
   • 12,000 ETB/night
   • Lake view, WiFi, Breakfast
   • Available: Sept 10-14

2. **Maribela Hotel** ⭐ 4.2
   • 10,000 ETB/night
   • Mountain view, Restaurant
   • Available: Sept 10-14

3. **Tukul Village** ⭐ 4.0
   • 8,000 ETB/night
   • Traditional huts, Cultural shows
   • Available: Sept 11-14

Which one interests you? 🏠
''';
  }

  // Activity Agent (FRS Section 7.7)
  String _buildActivityResponse() {
    return '''
🏛️ **Activities & Experiences**

🎯 **Cultural:**
• Coffee Ceremony Experience - 800 ETB
• Traditional Dance Show - 600 ETB
• Local Cooking Class - 1,000 ETB

🌄 **Historical:**
• Rock Church Tour - 1,500 ETB
• Archaeological Site Tour - 1,000 ETB
• Museum Visit - 500 ETB

🌿 **Nature:**
• Mountain Hiking - 1,000 ETB
• Bird Watching - 800 ETB
• Lake Tana Boat Trip - 2,000 ETB

What sounds good to you? 🌟
''';
  }

  // Greeting Response
  String _buildGreetingResponse() {
    return '''
👋 **Welcome to Pagume Trip!**

I'm your AI Travel Assistant (FRS Section 6.1 - Supervisor Agent).

I can help you:
• 🌍 **Discover** Ethiopian destinations
• 📅 **Plan** your perfect itinerary
• 🏨 **Find** verified accommodations
• 🚗 **Arrange** transportation
• 💰 **Manage** your budget
• 🏛️ **Book** activities and tours

Try saying: *"I want to visit Lalibela for 4 days with a budget of 40,000 ETB"*

Ready to start your journey? ✈️
''';
  }

  // Default Response (FRS Section 25 - No-Hallucination)
  String _buildDefaultResponse() {
    return '''
🤔 I understand you're interested in Ethiopian travel!

However, I need specific information to help you better.

📋 **Try asking me about:**
• **Destinations:** Lalibela, Gondar, Axum, Gorgora
• **Budget:** "I have a budget of 40,000 ETB"
• **Duration:** "I want to visit for 4 days"
• **Activities:** "I want a guided tour"
• **Accommodation:** "I want a comfortable hotel"

💡 Example: *"I want to visit Lalibela for 4 days with my family. Our budget is 40,000 ETB."*

What would you like to know? 🗺️
''';
  }

  // ============================================
  // BUILD UI
  // ============================================
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Travel Assistant'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              setState(() {
                _messages.clear();
              });
            },
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: _messages.isEmpty
                ? _buildEmptyState()
                : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];
                final isUser = message['isUser'] == true;

                if (message['isActivity'] == true) {
                  return _buildActivityWidget(message);
                }

                return _buildMessageBubble(
                  message['text'],
                  isUser,
                  message['isAgent'] == true,
                );
              },
            ),
          ),
          _buildInputField(),
        ],
      ),
    );
  }

  // ============================================
  // ACTIVITY WIDGET (FRS Section 36)
  // ============================================
  Widget _buildActivityWidget(Map<String, dynamic> message) {
    final steps = List<String>.from(message['steps'] ?? []);
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            message['text'],
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              color: Colors.blue,
            ),
          ),
          const SizedBox(height: 8),
          ...steps.map(
                (step) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 2),
              child: Text(
                step,
                style: TextStyle(
                  fontSize: 13,
                  color: step.startsWith('✅') ? Colors.green : Colors.grey,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ============================================
  // EMPTY STATE
  // ============================================
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

  Widget _buildQuickButton(String destination, IconData icon) {
    return ElevatedButton.icon(
      onPressed: () {
        _sendMessage('I want to visit $destination');
      },
      icon: Icon(icon, size: 16),
      label: Text(destination),
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.blue.shade50,
        foregroundColor: Colors.blue,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
      ),
    );
  }

  // ============================================
  // INPUT FIELD
  // ============================================
  Widget _buildInputField() {
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
              enabled: !_isProcessing,
              decoration: InputDecoration(
                hintText: _isProcessing ? 'Processing...' : 'Ask me about Ethiopia...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(25),
                  borderSide: BorderSide.none,
                ),
                filled: true,
                fillColor: Colors.grey.shade100,
                contentPadding: const EdgeInsets.symmetric(
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
            backgroundColor: _isProcessing ? Colors.grey : Colors.blue,
            child: IconButton(
              icon: Icon(
                _isProcessing ? Icons.hourglass_empty : Icons.send,
                color: Colors.white,
              ),
              onPressed: _isProcessing
                  ? null
                  : () {
                if (_controller.text.isNotEmpty) {
                  _sendMessage(_controller.text);
                  _controller.clear();
                }
              },
            ),
          ),
        ],
      ),
    );
  }

  // ============================================
  // MESSAGE BUBBLE
  // ============================================
  Widget _buildMessageBubble(String text, bool isUser, bool isAgent) {
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isUser ? Colors.blue : (isAgent ? Colors.blue.shade50 : Colors.grey.shade200),
          border: isAgent ? Border.all(color: Colors.blue.shade200) : null,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: isUser ? const Radius.circular(16) : Radius.zero,
            bottomRight: isUser ? Radius.zero : const Radius.circular(16),
          ),
        ),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        child: Text(
          text,
          style: TextStyle(
            color: isUser ? Colors.white : Colors.black87,
            height: 1.5,
          ),
        ),
      ),
    );
  }
}