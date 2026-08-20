import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/app_colors.dart';
import '../../core/providers/chat_provider.dart';
import '../../core/providers/user_provider.dart';

class TripPlannerScreen extends ConsumerWidget {
  const TripPlannerScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chatState = ref.watch(chatProvider);
    final savedTrips = chatState.savedTrips;
    final user = ref.watch(userProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('My Trips'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: savedTrips.isEmpty
          ? _buildEmptyState(context, ref) // Pass ref here
          : ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: savedTrips.length,
        itemBuilder: (context, index) {
          final trip = savedTrips[index];
          return _buildTripCard(context, ref, trip);
        },
      ),
    );
  }

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  Widget _buildEmptyState(BuildContext context, WidgetRef ref) {
    // Watch the user provider inside this function
    final user = ref.watch(userProvider);

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.map_outlined,
            size: 80,
            color: Colors.grey,
          ),
          const SizedBox(height: 16),
          Text(
            user.isAuthenticated
                ? 'Hi Traveler, no trips yet!'
                : 'No Trips Booked Yet',
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            'Go to the AI Chat and book\n your first Ethiopian adventure!',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {
              context.go('/chat');
            },
            icon: const Icon(Icons.chat_bubble_outline, size: 18),
            label: const Text('Plan a Trip Now'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================================
  // TRIP CARD
  // ==========================================================

  Widget _buildTripCard(BuildContext context, WidgetRef ref, TripProposal trip) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.primary.withOpacity(0.2),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 8,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: AppColors.accent.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  trip.duration,
                  style: TextStyle(
                    color: AppColors.accentDark,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const Spacer(),
              Text(
                '${trip.price} ${trip.currency}',
                style: const TextStyle(
                  color: AppColors.primary,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            trip.destination,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            trip.details,
            style: TextStyle(
              fontSize: 14,
              color: AppColors.grey600,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              // CANCEL BUTTON
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    _showCancelDialog(context, ref, trip);
                  },
                  icon: const Icon(Icons.cancel_outlined, size: 16),
                  label: const Text('Cancel Trip'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.red,
                    side: const BorderSide(color: Colors.red),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              // MAP BUTTON
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () async {
                    final String query = Uri.encodeComponent(trip.destination);
                    final String url =
                        'https://www.google.com/maps/search/?api=1&query=$query';
                    if (await canLaunchUrl(Uri.parse(url))) {
                      await launchUrl(Uri.parse(url),
                          mode: LaunchMode.externalApplication);
                    }
                  },
                  icon: const Icon(Icons.map_outlined, size: 16),
                  label: const Text('View Map'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,
                    side: BorderSide(
                        color: AppColors.primary.withOpacity(0.5)),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ==========================================================
  // CANCEL DIALOG
  // ==========================================================

  void _showCancelDialog(BuildContext context, WidgetRef ref, TripProposal trip) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Trip?'),
        content: Text(
          'Are you sure you want to cancel your trip to "${trip.destination}"? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
            },
            child: const Text('Keep Trip'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ref.read(chatProvider.notifier).cancelTrip(trip.id);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Yes, Cancel'),
          ),
        ],
      ),
    );
  }
}