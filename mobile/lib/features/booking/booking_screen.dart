import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/providers/chat_provider.dart';

class BookingScreen extends ConsumerStatefulWidget {
  const BookingScreen({super.key});

  @override
  ConsumerState<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends ConsumerState<BookingScreen> {
  // --- TRIP FORM CONTROLLERS ---
  final TextEditingController _destinationController = TextEditingController();
  final TextEditingController _daysController = TextEditingController();

  // --- FLIGHT FORM CONTROLLERS ---
  final TextEditingController _departureController = TextEditingController();
  final TextEditingController _arrivalController = TextEditingController();
  final TextEditingController _passengersController = TextEditingController();

  // --- CAR RENTAL CONTROLLERS ---
  final TextEditingController _pickupLocationController = TextEditingController();
  final TextEditingController _vehicleTypeController = TextEditingController();
  final TextEditingController _rentalDaysController = TextEditingController();

  // --- STATE ---
  String _selectedCurrency = 'ETB';
  int _bookingTypeIndex = 0; // 0 = Trip, 1 = Flight, 2 = Car

  // Pre-set trips for quick selection
  final List<Map<String, String>> _quickDestinations = [
    {'name': 'Lalibela', 'emoji': '⛪', 'duration': '4 Days', 'price': '27,000'},
    {'name': 'Gondar', 'emoji': '🏰', 'duration': '3 Days', 'price': '18,000'},
    {'name': 'Axum', 'emoji': '🗿', 'duration': '3 Days', 'price': '21,000'},
    {'name': 'Gorgora', 'emoji': '🌅', 'duration': '4 Days', 'price': '44,000'},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Plan Your Trip'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Type Selector (Trips vs Flights vs Car)
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: AppColors.grey100,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _bookingTypeIndex = 0),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: _bookingTypeIndex == 0 ? AppColors.primary : Colors.transparent,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Center(
                          child: Text(
                            '🏨 Trips',
                            style: TextStyle(
                              color: _bookingTypeIndex == 0 ? Colors.white : AppColors.grey600,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _bookingTypeIndex = 1),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: _bookingTypeIndex == 1 ? AppColors.primary : Colors.transparent,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Center(
                          child: Text(
                            '✈️ Flights',
                            style: TextStyle(
                              color: _bookingTypeIndex == 1 ? Colors.white : AppColors.grey600,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => _bookingTypeIndex = 2),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                        decoration: BoxDecoration(
                          color: _bookingTypeIndex == 2 ? AppColors.primary : Colors.transparent,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Center(
                          child: Text(
                            '🚗 Car',
                            style: TextStyle(
                              color: _bookingTypeIndex == 2 ? Colors.white : AppColors.grey600,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // --- TRIP BOOKING FORM ---
            if (_bookingTypeIndex == 0) ...[
              const Text(
                'Popular Destinations',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                height: 120,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _quickDestinations.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                  itemBuilder: (context, index) {
                    final dest = _quickDestinations[index];
                    return GestureDetector(
                      onTap: () {
                        _destinationController.text = dest['name']!;
                        _daysController.text = dest['duration']!.split(' ')[0];
                      },
                      child: Container(
                        width: 130,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.grey200),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(dest['emoji']!, style: const TextStyle(fontSize: 32)),
                            const SizedBox(height: 8),
                            Text(
                              dest['name']!,
                              style: const TextStyle(fontWeight: FontWeight.bold),
                              textAlign: TextAlign.center,
                            ),
                            Text(
                              '${dest['duration']} · ${dest['price']} ETB',
                              style: TextStyle(fontSize: 10, color: AppColors.grey600),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 24),

              const Text(
                'Custom Trip Details',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 16),

              TextField(
                controller: _destinationController,
                decoration: const InputDecoration(
                  labelText: 'Destination',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.location_on),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _daysController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Number of Days',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.calendar_today),
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: _selectedCurrency,
                items: ['ETB', 'USD'].map((currency) {
                  return DropdownMenuItem(
                    value: currency,
                    child: Text(currency),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() => _selectedCurrency = value!);
                },
                decoration: const InputDecoration(
                  labelText: 'Currency',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.monetization_on),
                ),
              ),
              const SizedBox(height: 24),

              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: _bookTrip,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text('Confirm Manual Booking ✈️', style: TextStyle(fontSize: 16)),
                ),
              ),
            ],

            // --- FLIGHT BOOKING FORM ---
            if (_bookingTypeIndex == 1) ...[
              const Text(
                'Search Flights',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 16),

              TextField(
                controller: _departureController,
                decoration: const InputDecoration(
                  labelText: 'Departure City',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.flight_takeoff),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _arrivalController,
                decoration: const InputDecoration(
                  labelText: 'Arrival City',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.flight_land),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _passengersController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Passengers',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.people),
                ),
              ),
              const SizedBox(height: 24),

              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: _bookFlight,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accentDark,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text('Search Flights ✈️', style: TextStyle(fontSize: 16)),
                ),
              ),
            ],

            // --- CAR RENTAL FORM ---
            if (_bookingTypeIndex == 2) ...[
              const Text(
                'Rent a Car',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 16),

              TextField(
                controller: _pickupLocationController,
                decoration: const InputDecoration(
                  labelText: 'Pickup Location',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.location_on),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _vehicleTypeController,
                decoration: const InputDecoration(
                  labelText: 'Vehicle Type (e.g., SUV, Sedan)',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.directions_car),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _rentalDaysController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Rental Days',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.calendar_today),
                ),
              ),
              const SizedBox(height: 24),

              SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: _bookCar,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.orange,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text('Search Cars 🚗', style: TextStyle(fontSize: 16)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  // --- TRIP BOOKING LOGIC ---
  void _bookTrip() {
    if (_destinationController.text.isEmpty || _daysController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in all fields')),
      );
      return;
    }

    final String destination = _destinationController.text.trim();
    final int days = int.tryParse(_daysController.text) ?? 3;
    final double basePrice = days * 5000;
    final String displayPrice = basePrice.toStringAsFixed(0);

    final proposal = TripProposal(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      destination: '$destination - $days Day Custom Tour',
      duration: '$days Days',
      price: double.parse(displayPrice),
      currency: _selectedCurrency,
      details: 'Custom trip created manually by the user.',
      status: 'pending',
    );

    ref.read(chatProvider.notifier).setProposal(proposal);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('✅ Trip to $destination created! Check the Chat tab.'),
        backgroundColor: AppColors.primary,
      ),
    );

    Future.delayed(const Duration(milliseconds: 500), () {
      context.go('/chat');
    });
  }

  // --- FLIGHT BOOKING LOGIC ---
  void _bookFlight() {
    if (_departureController.text.isEmpty ||
        _arrivalController.text.isEmpty ||
        _passengersController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in flight details')),
      );
      return;
    }

    final String departure = _departureController.text.trim();
    final String arrival = _arrivalController.text.trim();
    final int passengers = int.tryParse(_passengersController.text) ?? 1;
    final double basePrice = passengers * 3500;
    final String displayPrice = basePrice.toStringAsFixed(0);

    final proposal = TripProposal(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      destination: 'Flight: $departure to $arrival',
      duration: 'Direct Flight',
      price: double.parse(displayPrice),
      currency: _selectedCurrency,
      details: 'Flight for $passengers passenger(s).',
      status: 'pending',
    );

    ref.read(chatProvider.notifier).setProposal(proposal);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('✈️ Flight from $departure to $arrival found! Check the Chat tab.'),
        backgroundColor: AppColors.accentDark,
      ),
    );

    Future.delayed(const Duration(milliseconds: 500), () {
      context.go('/chat');
    });
  }

  // --- CAR RENTAL LOGIC ---
  void _bookCar() {
    if (_pickupLocationController.text.isEmpty ||
        _vehicleTypeController.text.isEmpty ||
        _rentalDaysController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in car rental details')),
      );
      return;
    }

    final String pickup = _pickupLocationController.text.trim();
    final String vehicle = _vehicleTypeController.text.trim();
    final int days = int.tryParse(_rentalDaysController.text) ?? 1;
    final double basePrice = days * 2500;
    final String displayPrice = basePrice.toStringAsFixed(0);

    final proposal = TripProposal(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      destination: 'Car Rental: $vehicle in $pickup',
      duration: '$days Days',
      price: double.parse(displayPrice),
      currency: _selectedCurrency,
      details: 'Rental for $days day(s).',
      status: 'pending',
    );

    ref.read(chatProvider.notifier).setProposal(proposal);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('🚗 $vehicle rental found in $pickup! Check the Chat tab.'),
        backgroundColor: Colors.orange,
      ),
    );

    Future.delayed(const Duration(milliseconds: 500), () {
      context.go('/chat');
    });
  }

  @override
  void dispose() {
    _destinationController.dispose();
    _daysController.dispose();
    _departureController.dispose();
    _arrivalController.dispose();
    _passengersController.dispose();
    _pickupLocationController.dispose();
    _vehicleTypeController.dispose();
    _rentalDaysController.dispose();
    super.dispose();
  }
}