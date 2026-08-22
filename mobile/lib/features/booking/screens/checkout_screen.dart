import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/providers/manual_booking_provider.dart';
import '../widgets/catalog_widgets.dart';

class CheckoutScreen extends ConsumerWidget {
  const CheckoutScreen({super.key});

  Future<void> _pickDate({
    required BuildContext context,
    required WidgetRef ref,
    required bool isCheckIn,
    required CheckoutDraft draft,
  }) async {
    final initial = isCheckIn
        ? (draft.checkIn ?? DateTime.now().add(const Duration(days: 1)))
        : (draft.checkOut ??
            (draft.checkIn ?? DateTime.now()).add(const Duration(days: 2)));
    final firstDate = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: initial.isBefore(firstDate) ? firstDate : initial,
      firstDate: firstDate,
      lastDate: firstDate.add(const Duration(days: 365)),
    );
    if (picked == null) return;
    if (isCheckIn) {
      var checkOut = draft.checkOut;
      if (checkOut == null || !checkOut.isAfter(picked)) {
        checkOut = picked.add(const Duration(days: 1));
      }
      ref.read(manualBookingProvider.notifier).updateDates(
            checkIn: picked,
            checkOut: checkOut,
          );
    } else {
      ref.read(manualBookingProvider.notifier).updateDates(checkOut: picked);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(manualBookingProvider);
    final draft = state.draft;

    if (draft == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Checkout')),
        body: const CatalogEmpty(
          message: 'Nothing to check out. Pick a hotel, package, or car first.',
        ),
      );
    }

    final typeLabel = switch (draft.serviceType) {
      ManualServiceType.hotel => 'Hotel',
      ManualServiceType.tour => 'Tour package',
      ManualServiceType.vehicle => 'Car rental',
    };

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Checkout'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(typeLabel,
              style: const TextStyle(color: AppColors.grey600, fontSize: 13)),
          Text(
            draft.name,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 20),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Check-in'),
            subtitle: Text(
              draft.checkIn != null
                  ? CheckoutDraft.formatDate(draft.checkIn!)
                  : 'Select date',
            ),
            trailing: const Icon(Icons.calendar_today),
            onTap: () => _pickDate(
              context: context,
              ref: ref,
              isCheckIn: true,
              draft: draft,
            ),
          ),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(
              draft.serviceType == ManualServiceType.tour
                  ? 'End date'
                  : 'Check-out',
            ),
            subtitle: Text(
              draft.checkOut != null
                  ? CheckoutDraft.formatDate(draft.checkOut!)
                  : 'Select date',
            ),
            trailing: const Icon(Icons.calendar_today),
            onTap: () => _pickDate(
              context: context,
              ref: ref,
              isCheckIn: false,
              draft: draft,
            ),
          ),
          if (draft.serviceType != ManualServiceType.tour)
            Text(
              '${draft.nightCount} night${draft.nightCount == 1 ? '' : 's'}'
              ' × ${draft.unitPriceEtb.toStringAsFixed(0)} ${draft.currency}',
              style: const TextStyle(color: AppColors.grey600),
            ),
          const Divider(height: 32),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Total',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              PriceTag(amount: draft.totalPrice, currency: draft.currency),
            ],
          ),
          if (state.error != null) ...[
            const SizedBox(height: 16),
            Text(
              state.error!,
              style: const TextStyle(color: Colors.redAccent),
            ),
          ],
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: state.isSubmitting
                  ? null
                  : () async {
                      final ok = await ref
                          .read(manualBookingProvider.notifier)
                          .submitCheckout();
                      if (ok && context.mounted) {
                        context.go('/booking/confirmation');
                      }
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
              ),
              child: state.isSubmitting
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text('Confirm booking'),
            ),
          ),
        ],
      ),
    );
  }
}
