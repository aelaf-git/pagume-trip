import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';

class TripItineraryScreen extends StatelessWidget {
  const TripItineraryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Gondar'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.more_vert),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Day Header
            const Text(
              'Day 1 • Oct 12',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),

            // Flight Card
            _buildItineraryCard(
              icon: Icons.flight_takeoff,
              title: 'Flight to Gondar',
              status: 'CONFIRMED',
              statusColor: Colors.green,
              details: 'ET 122 · Addis Ababa (ADD) to Gondar (GDQ)',
              buttonText: 'View Boarding Pass',
              onButtonPressed: () {},
            ),
            const SizedBox(height: 12),

            // Hotel Card
            _buildItineraryCard(
              icon: Icons.hotel,
              title: 'Check-in',
              status: '',
              statusColor: Colors.transparent,
              details: 'Kurifu Resort & Spa\nConfirmation: #KRF-8821',
              buttonText: 'Get Directions',
              onButtonPressed: () {},
            ),
            const SizedBox(height: 12),

            // Tour Card
            _buildItineraryCard(
              icon: Icons.tour,
              title: 'Suggested Tour',
              status: '',
              statusColor: Colors.transparent,
              details: 'Fasil Ghebbi Royal Enclosure\nExplore the remains of a fortress-city within Gondar.',
              buttonText: 'Add to Itinerary',
              onButtonPressed: () {},
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildItineraryCard({
    required IconData icon,
    required String title,
    required String status,
    required Color statusColor,
    required String details,
    required String buttonText,
    required VoidCallback onButtonPressed,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 10,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  icon,
                  color: AppColors.primary,
                  size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Row(
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const Spacer(),
                    if (status.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: statusColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          status,
                          style: TextStyle(
                            color: statusColor,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            details,
            style: TextStyle(
              color: Colors.grey.shade600,
              fontSize: 14,
              height: 1.5,
            ),
          ),
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: onButtonPressed,
              style: TextButton.styleFrom(
                foregroundColor: AppColors.primary,
              ),
              child: Text(buttonText),
            ),
          ),
        ],
      ),
    );
  }
}