import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/providers/manual_booking_provider.dart';
import '../widgets/catalog_widgets.dart';

class ConfirmationScreen extends ConsumerWidget {
  const ConfirmationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final booking = ref.watch(manualBookingProvider).confirmedBooking;

    if (booking == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Confirmation')),
        body: const CatalogEmpty(
          message: 'No confirmation to show. Complete a booking first.',
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Booking confirmed'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        automaticallyImplyLeading: false,
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(Icons.check_circle, size: 72, color: AppColors.primary),
            const SizedBox(height: 16),
            const Text(
              'You are all set!',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              booking.items.isNotEmpty
                  ? booking.items.first.name
                  : 'Your booking',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.grey700),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.grey200),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  _row('Booking ID', booking.id),
                  _row(
                    'Confirmation',
                    booking.confirmationCode ?? '—',
                  ),
                  _row('Status', booking.status),
                  _row(
                    'Total',
                    '${booking.priceEtb.toStringAsFixed(0)} ${booking.currency}',
                  ),
                  if (booking.items.isNotEmpty &&
                      booking.items.first.checkIn != null)
                    _row('Check-in', booking.items.first.checkIn!),
                  if (booking.items.isNotEmpty &&
                      booking.items.first.checkOut != null)
                    _row('Check-out', booking.items.first.checkOut!),
                ],
              ),
            ),
            const Spacer(),
            ElevatedButton(
              onPressed: () {
                ref.read(manualBookingProvider.notifier).clearConfirmation();
                context.go('/trips');
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(48),
              ),
              child: const Text('View My Trips'),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () {
                ref.read(manualBookingProvider.notifier).clearConfirmation();
                context.go('/booking');
              },
              child: const Text('Book something else'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.grey600)),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}
