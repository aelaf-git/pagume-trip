import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/providers/catalog_provider.dart';
import 'widgets/catalog_widgets.dart';

/// Book tab root — destinations from the database.
class BookingScreen extends ConsumerWidget {
  const BookingScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncDestinations = ref.watch(destinationsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Explore & Book'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: asyncDestinations.when(
        loading: () => const CatalogLoading(message: 'Loading destinations…'),
        error: (e, _) => CatalogError(
          message: e.toString(),
          onRetry: () => ref.invalidate(destinationsProvider),
        ),
        data: (destinations) {
          if (destinations.isEmpty) {
            return const CatalogEmpty(
              message:
                  'No destinations yet. Make sure inventory is seeded in the API.',
            );
          }
          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () async {
              ref.invalidate(destinationsProvider);
              await ref.read(destinationsProvider.future);
            },
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 12),
              itemCount: destinations.length + 1,
              itemBuilder: (context, index) {
                if (index == 0) {
                  return const Padding(
                    padding: EdgeInsets.fromLTRB(16, 8, 16, 4),
                    child: Text(
                      'Choose a destination to browse hotels, tour packages, and car rentals.',
                      style: TextStyle(color: AppColors.grey600, fontSize: 14),
                    ),
                  );
                }
                final dest = destinations[index - 1];
                final region = [
                  if (dest.region.isNotEmpty) dest.region,
                  if (dest.zone.isNotEmpty) dest.zone,
                ].join(' · ');
                return CatalogImageCard(
                  title: dest.name,
                  images: dest.images,
                  fallbackIcon: Icons.place_outlined,
                  imageHeight: 160,
                  subtitle: [
                    if (region.isNotEmpty) region,
                    if (dest.recommendedDurationDays != null)
                      '${dest.recommendedDurationDays} days recommended',
                    if (dest.description.isNotEmpty) dest.description,
                  ].join(' · '),
                  onTap: () => context.push('/booking/destinations/${dest.id}'),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
