import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/providers/catalog_provider.dart';
import '../../../core/providers/manual_booking_provider.dart';
import '../widgets/catalog_widgets.dart';

class TourDetailScreen extends ConsumerWidget {
  const TourDetailScreen({super.key, required this.tourId});

  final String tourId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(tourProvider(tourId));

    return async.when(
      loading: () => Scaffold(
        appBar: AppBar(title: const Text('Tour package')),
        body: const CatalogLoading(),
      ),
      error: (e, _) => Scaffold(
        appBar: AppBar(title: const Text('Tour package')),
        body: CatalogError(
          message: e.toString(),
          onRetry: () => ref.invalidate(tourProvider(tourId)),
        ),
      ),
      data: (tour) => Scaffold(
        backgroundColor: AppColors.background,
        body: CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: 240,
              pinned: true,
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              title: Text(tour.name),
              flexibleSpace: FlexibleSpaceBar(
                background: CatalogImageHeader(
                  images: tour.images,
                  fallbackIcon: Icons.tour_outlined,
                  height: 280,
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(tour.durationLabel,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w600)),
                              Text(
                                  '${tour.category} · up to ${tour.maxParticipants} guests'),
                              Text('${tour.seatsRemaining} seats remaining',
                                  style: const TextStyle(
                                      color: AppColors.grey600)),
                            ],
                          ),
                        ),
                        PriceTag(
                            amount: tour.priceEtb, currency: tour.currency),
                      ],
                    ),
                    const SizedBox(height: 16),
                    if (tour.description.isNotEmpty) ...[
                      Text(tour.description,
                          style: const TextStyle(color: AppColors.grey700)),
                      const SizedBox(height: 16),
                    ],
                    if (tour.included.isNotEmpty) ...[
                      const Text('Included',
                          style: TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 8),
                      ...tour.included.map(
                        (i) => ListTile(
                          dense: true,
                          leading: const Icon(Icons.check,
                              color: AppColors.primary),
                          title: Text(i),
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                    ],
                    if (tour.excluded.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      const Text('Excluded',
                          style: TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 16)),
                      ...tour.excluded.map(
                        (i) => ListTile(
                          dense: true,
                          leading: const Icon(Icons.close,
                              color: AppColors.grey500),
                          title: Text(i),
                          contentPadding: EdgeInsets.zero,
                        ),
                      ),
                    ],
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        onPressed: () {
                          ref
                              .read(manualBookingProvider.notifier)
                              .startTourCheckout(tour: tour);
                          context.push('/booking/checkout');
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                        ),
                        child: const Text('Book this package'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
