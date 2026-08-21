import 'package:flutter/material.dart';
import '../../data/models/trip.dart';
import '../../data/models/booking.dart';
import '../../data/models/itinerary.dart';
import '../../core/constants/app_colors.dart';

class TripPlannerScreen extends StatefulWidget {
  const TripPlannerScreen({super.key});

  @override
  State<TripPlannerScreen> createState() => _TripPlannerScreenState();
}

class _TripPlannerScreenState extends State<TripPlannerScreen> {
  Trip? _currentTrip;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _currentTrip = _createSampleTrip();
  }

  Trip _createSampleTrip() {
    return Trip(
      id: 'PT-82931',
      destination: 'Gorgora',
      startDate: DateTime(2024, 10, 15),
      endDate: DateTime(2024, 10, 18),
      travelers: 6,
      budget: 60000,
      estimatedCost: 44000,
      status: 'booked',
      bookings: [
        Booking(
          id: 'B-001',
          tripId: 'PT-82931',
          serviceType: 'hotel',
          providerName: 'Gorgora Resort',
          serviceName: 'Deluxe Suite',
          price: 18000,
          currency: 'ETB',
          bookingDate: DateTime.now(),
          startDate: DateTime(2024, 10, 15),
          endDate: DateTime(2024, 10, 18),
          status: 'confirmed',
          confirmationCode: 'HOTEL-12345',
          details: {'room': '101', 'view': 'Lake View'},
        ),
        Booking(
          id: 'B-002',
          tripId: 'PT-82931',
          serviceType: 'transport',
          providerName: 'Gorgora Transport',
          serviceName: 'Private Minibus',
          price: 20000,
          currency: 'ETB',
          bookingDate: DateTime.now(),
          startDate: DateTime(2024, 10, 15),
          endDate: DateTime(2024, 10, 18),
          status: 'confirmed',
          confirmationCode: 'TRANS-67890',
          details: {'seats': 6, 'driver': 'Yes'},
        ),
        Booking(
          id: 'B-003',
          tripId: 'PT-82931',
          serviceType: 'activity',
          providerName: 'Tana Tours',
          serviceName: 'Lake Tana Boat Trip',
          price: 6000,
          currency: 'ETB',
          bookingDate: DateTime.now(),
          startDate: DateTime(2024, 10, 16),
          endDate: DateTime(2024, 10, 16),
          status: 'confirmed',
          confirmationCode: 'BOAT-54321',
          details: {'duration': '4 hours', 'includes': 'Guide, Snacks'},
        ),
      ],
      itinerary: Itinerary(
        days: [
          ItineraryDay(
            dayNumber: 1,
            date: 'Oct 15, 2024',
            items: [
              ItineraryItem(
                time: '08:00 AM',
                activity: 'Travel to Gorgora',
                description: 'Depart from Addis Ababa',
                location: 'Addis Ababa',
              ),
              ItineraryItem(
                time: '02:00 PM',
                activity: 'Check-in',
                description: 'Check-in at Gorgora Resort',
                location: 'Gorgora Resort',
                bookingId: 'B-001',
              ),
              ItineraryItem(
                time: '07:00 PM',
                activity: 'Dinner',
                description: 'Welcome dinner at resort',
                location: 'Gorgora Resort',
              ),
            ],
          ),
          ItineraryDay(
            dayNumber: 2,
            date: 'Oct 16, 2024',
            items: [
              ItineraryItem(
                time: '09:00 AM',
                activity: 'Boat Trip',
                description: 'Lake Tana boat tour with guide',
                location: 'Lake Tana',
                cost: 6000,
                bookingId: 'B-003',
              ),
              ItineraryItem(
                time: '02:00 PM',
                activity: 'Monastery Visit',
                description: 'Visit ancient island monasteries',
                location: 'Lake Tana',
              ),
            ],
          ),
          ItineraryDay(
            dayNumber: 3,
            date: 'Oct 17, 2024',
            items: [
              ItineraryItem(
                time: '10:00 AM',
                activity: 'Cultural Activities',
                description: 'Coffee ceremony and cultural tours',
                location: 'Gorgora',
              ),
              ItineraryItem(
                time: '03:00 PM',
                activity: 'Relaxation',
                description: 'Free time at resort',
                location: 'Gorgora Resort',
              ),
            ],
          ),
          ItineraryDay(
            dayNumber: 4,
            date: 'Oct 18, 2024',
            items: [
              ItineraryItem(
                time: '09:00 AM',
                activity: 'Breakfast',
                description: 'Final breakfast at resort',
                location: 'Gorgora Resort',
              ),
              ItineraryItem(
                time: '11:00 AM',
                activity: 'Check-out',
                description: 'Check-out and return to Addis',
                location: 'Gorgora',
              ),
            ],
          ),
        ],
      ),
      preferences: {
        'accommodation': 'comfortable',
        'transport': 'private',
        'activities': ['boat trip', 'cultural'],
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('My Trips'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Go to AI Chat to create a new trip!'),
                ),
              );
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _currentTrip == null
          ? _buildEmptyState()
          : _buildTripDetails(),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.trip_origin,
            size: 80,
            color: Colors.grey,
          ),
          const SizedBox(height: 16),
          const Text(
            'No Trips Yet',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Start planning your first adventure!\nChat with the AI agent to get started.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.chat),
            label: const Text('Chat with AI'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(
                horizontal: 32,
                vertical: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTripDetails() {
    final trip = _currentTrip!;

    return SingleChildScrollView(  // ✅ FIXED: was SingleChildScrollUp
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildTripSummary(trip),
          const SizedBox(height: 16),
          _buildItinerary(trip),
          const SizedBox(height: 16),
          _buildBookings(trip),
          const SizedBox(height: 16),
          _buildBudgetSummary(trip),
        ],
      ),
    );
  }

  Widget _buildTripSummary(Trip trip) {
    final days = trip.itinerary.days.length;

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Text(
                  'Trip ID: ',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                Text(trip.id),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: _getStatusColor(trip.status),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    trip.status.toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              trip.destination,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '${trip.travelers} travelers • ${days} days',
              style: TextStyle(
                fontSize: 14,
                color: AppColors.grey600,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '${_formatDate(trip.startDate)} - ${_formatDate(trip.endDate)}',
              style: TextStyle(
                fontSize: 14,
                color: AppColors.grey600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildItinerary(Trip trip) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '📅 Itinerary',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ...trip.itinerary.days.map((day) => _buildDayCard(day)),
          ],
        ),
      ),
    );
  }

  Widget _buildDayCard(ItineraryDay day) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.grey50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.grey200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Day ${day.dayNumber}: ${day.date}',
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 8),
          ...day.items.map((item) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.time,
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.grey600,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        item.activity,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        item.description,
                        style: TextStyle(
                          fontSize: 12,
                          color: AppColors.grey600,
                        ),
                      ),
                      if (item.bookingId != null)
                        Container(
                          margin: const EdgeInsets.only(top: 4),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.green.shade100,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '✅ Booked',
                            style: TextStyle(
                              fontSize: 10,
                              color: Colors.green.shade700,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      if (item.cost != null)
                        Text(
                          '💰 ${item.cost!.toStringAsFixed(0)} ETB',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.grey600,
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildBookings(Trip trip) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '🏨 Bookings',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            ...trip.bookings.map((booking) => Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.grey50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.grey200),
              ),
              child: Row(
                children: [
                  Icon(
                    _getServiceIcon(booking.serviceType),
                    color: AppColors.primary,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          booking.serviceName,
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          '${booking.providerName} • ${booking.price.toStringAsFixed(0)} ${booking.currency}',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.grey600,
                          ),
                        ),
                        Text(
                          'Confirmation: ${booking.confirmationCode}',
                          style: TextStyle(
                            fontSize: 10,
                            color: AppColors.grey500,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: _getStatusColor(booking.status),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      booking.status.toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            )),
          ],
        ),
      ),
    );
  }

  Widget _buildBudgetSummary(Trip trip) {
    final totalBooked = trip.bookings.fold<double>(
      0,
          (sum, booking) => sum + booking.price,
    );
    final remaining = trip.budget - totalBooked;

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '💰 Budget Summary',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            _buildBudgetRow('Budget', trip.budget, AppColors.primary),
            _buildBudgetRow('Estimated', trip.estimatedCost, AppColors.accentDark),
            _buildBudgetRow('Booked', totalBooked, Colors.green),
            _buildBudgetRow('Remaining', remaining, remaining >= 0 ? Colors.green : Colors.red),
            const Divider(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Status',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                Text(
                  remaining >= 0 ? '✅ Within Budget' : '❌ Over Budget',
                  style: TextStyle(
                    color: remaining >= 0 ? Colors.green : Colors.red,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBudgetRow(String label, double amount, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(
            '${amount.toStringAsFixed(0)} ETB',
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  IconData _getServiceIcon(String serviceType) {
    switch (serviceType) {
      case 'hotel':
        return Icons.hotel;
      case 'transport':
        return Icons.directions_car;
      case 'activity':
        return Icons.celebration;
      case 'tour':
        return Icons.tour;
      default:
        return Icons.bookmark;
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'booked':
        return Colors.green;
      case 'pending':
        return Colors.orange;
      case 'draft':
        return Colors.grey;
      case 'cancelled':
        return Colors.red;
      case 'completed':
        return AppColors.primary;
      default:
        return Colors.grey;
    }
  }

  String _formatDate(DateTime date) {
    return '${date.month}/${date.day}/${date.year}';
  }
}