import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/constants/app_colors.dart';
import '../../data/models/trip.dart';

class TripPlannerScreen extends StatefulWidget {
  const TripPlannerScreen({super.key});

  @override
  State<TripPlannerScreen> createState() => _TripPlannerScreenState();
}

class _TripPlannerScreenState extends State<TripPlannerScreen> {
  final List<Trip> trips = [];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,

      appBar: AppBar(
        title: const Text('My Trips'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),

      body: trips.isEmpty
          ? _buildEmptyState(context)
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: trips.length,
              itemBuilder: (context, index) {
                return _buildTripCard(trips[index]);
              },
            ),
    );
  }

  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.map_outlined,
              size: 80,
              color: Colors.grey,
            ),

            const SizedBox(height: 16),

            const Text(
              'No Trips Booked Yet',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 8),

            const Text(
              'Go to the AI Chat and plan\nyour first Ethiopian adventure!',
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

              icon: const Icon(
                Icons.chat_bubble_outline,
                size: 18,
              ),

              label: const Text('Plan a Trip Now'),

              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,

                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 12,
                ),

                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ==========================================================
  // TRIP CARD
  // ==========================================================

  Widget _buildTripCard(Trip trip) {
    final int duration =
        trip.endDate.difference(trip.startDate).inDays;

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
          // ==================================================
          // TOP ROW
          // ==================================================

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
                  '$duration days',
                  style: TextStyle(
                    color: AppColors.accentDark,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),

              const Spacer(),

              Text(
                '${trip.estimatedCost.toStringAsFixed(2)} ETB',
                style: const TextStyle(
                  color: AppColors.primary,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // ==================================================
          // DESTINATION
          // ==================================================

          Text(
            trip.destination,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),

          const SizedBox(height: 8),

          // ==================================================
          // DATES
          // ==================================================

          Row(
            children: [
              const Icon(
                Icons.calendar_today_outlined,
                size: 16,
                color: Colors.grey,
              ),

              const SizedBox(width: 6),

              Text(
                '${_formatDate(trip.startDate)} - '
                '${_formatDate(trip.endDate)}',

                style: TextStyle(
                  fontSize: 14,
                  color: AppColors.grey600,
                ),
              ),
            ],
          ),

          const SizedBox(height: 6),

          // ==================================================
          // TRAVELERS
          // ==================================================

          Row(
            children: [
              const Icon(
                Icons.people_outline,
                size: 18,
                color: Colors.grey,
              ),

              const SizedBox(width: 6),

              Text(
                '${trip.travelers} traveler'
                '${trip.travelers == 1 ? '' : 's'}',

                style: TextStyle(
                  fontSize: 14,
                  color: AppColors.grey600,
                ),
              ),
            ],
          ),

          const SizedBox(height: 6),

          // ==================================================
          // STATUS
          // ==================================================

          Row(
            children: [
              const Icon(
                Icons.info_outline,
                size: 18,
                color: Colors.grey,
              ),

              const SizedBox(width: 6),

              Text(
                trip.status,
                style: TextStyle(
                  fontSize: 14,
                  color: AppColors.grey600,
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // ==================================================
          // BUTTONS
          // ==================================================

          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    _showCancelDialog(trip);
                  },

                  icon: const Icon(
                    Icons.cancel_outlined,
                    size: 16,
                  ),

                  label: const Text('Cancel Trip'),

                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.red,

                    side: const BorderSide(
                      color: Colors.red,
                    ),

                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ),

              const SizedBox(width: 8),

              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    _openMap(trip.destination);
                  },

                  icon: const Icon(
                    Icons.map_outlined,
                    size: 16,
                  ),

                  label: const Text('View Map'),

                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.primary,

                    side: BorderSide(
                      color: AppColors.primary.withOpacity(0.5),
                    ),

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
  // DATE FORMAT
  // ==========================================================

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  // ==========================================================
  // GOOGLE MAPS
  // ==========================================================

  Future<void> _openMap(String destination) async {
    final String query = Uri.encodeComponent(destination);

    final Uri url = Uri.parse(
      'https://www.google.com/maps/search/?api=1&query=$query',
    );

    if (await canLaunchUrl(url)) {
      await launchUrl(
        url,
        mode: LaunchMode.externalApplication,
      );
    }
  }

  // ==========================================================
  // CANCEL DIALOG
  // ==========================================================

  void _showCancelDialog(Trip trip) {
    showDialog(
      context: context,

      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Cancel Trip?'),

          content: Text(
            'Are you sure you want to cancel your trip to '
            '"${trip.destination}"?',
          ),

          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(dialogContext);
              },

              child: const Text('Keep Trip'),
            ),

            ElevatedButton(
              onPressed: () {
                setState(() {
                  trips.removeWhere(
                    (item) => item.id == trip.id,
                  );
                });

                Navigator.pop(dialogContext);
              },

              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
              ),

              child: const Text('Yes, Cancel'),
            ),
          ],
        );
      },
    );
  }
}