import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/providers/catalog_provider.dart';
import '../../../core/providers/manual_booking_provider.dart';
import '../../../data/models/hotel.dart';
import '../widgets/catalog_widgets.dart';

class HotelDetailScreen extends ConsumerWidget {
  const HotelDetailScreen({super.key, required this.hotelId});

  final String hotelId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(hotelProvider(hotelId));

    return async.when(
      loading: () => Scaffold(
        appBar: AppBar(title: const Text('Hotel')),
        body: const CatalogLoading(),
      ),
      error: (e, _) => Scaffold(
        appBar: AppBar(title: const Text('Hotel')),
        body: CatalogError(
          message: e.toString(),
          onRetry: () => ref.invalidate(hotelProvider(hotelId)),
        ),
      ),
      data: (hotel) => Scaffold(
        backgroundColor: AppColors.background,
        body: CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: 240,
              pinned: true,
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              title: Text(hotel.name),
              flexibleSpace: FlexibleSpaceBar(
                background: CatalogImageHeader(
                  images: hotel.images,
                  fallbackIcon: Icons.hotel_outlined,
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
                    _meta(hotel),
                    const SizedBox(height: 16),
                    if (hotel.description.isNotEmpty) ...[
                      Text(hotel.description,
                          style: const TextStyle(color: AppColors.grey700)),
                      const SizedBox(height: 16),
                    ],
                    if (hotel.amenities.isNotEmpty) ...[
                      const Text('Amenities',
                          style: TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: hotel.amenities
                            .map((a) => Chip(
                                  label: Text(a),
                                  backgroundColor: AppColors.grey100,
                                  side: BorderSide.none,
                                ))
                            .toList(),
                      ),
                      const SizedBox(height: 20),
                    ],
                    const Text('Rooms',
                        style: TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 16)),
                    const SizedBox(height: 8),
                    if (hotel.rooms.isEmpty)
                      const CatalogEmpty(
                          message: 'No rooms listed for this hotel.')
                    else
                      ...hotel.rooms.map((room) => _RoomCard(
                            hotel: hotel,
                            room: room,
                            onBook: () {
                              ref
                                  .read(manualBookingProvider.notifier)
                                  .startHotelCheckout(hotel: hotel, room: room);
                              context.push('/booking/checkout');
                            },
                          )),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _meta(Hotel hotel) {
    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(hotel.propertyType,
                  style: const TextStyle(color: AppColors.grey600)),
              Text(
                hotel.comfortLevel,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              if (hotel.rating > 0)
                Text('★ ${hotel.rating.toStringAsFixed(1)}'),
              Text(
                'Check-in ${hotel.checkInTime} · Check-out ${hotel.checkOutTime}',
                style: const TextStyle(fontSize: 12, color: AppColors.grey600),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _RoomCard extends StatelessWidget {
  const _RoomCard({
    required this.hotel,
    required this.room,
    required this.onBook,
  });

  final Hotel hotel;
  final HotelRoom room;
  final VoidCallback onBook;

  @override
  Widget build(BuildContext context) {
    final roomImages =
        room.images.isNotEmpty ? room.images : hotel.images;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.grey200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          CatalogPhoto(
            images: roomImages,
            fallbackIcon: Icons.bed_outlined,
            height: 140,
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        room.roomType,
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 16,
                        ),
                      ),
                    ),
                    PriceTag(
                      amount: room.nightlyPriceEtb,
                      currency: room.currency,
                      suffix: '/night',
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '${room.capacity} guests · ${room.beds} bed${room.beds == 1 ? '' : 's'}',
                  style: const TextStyle(color: AppColors.grey600),
                ),
                if (room.description.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(room.description),
                ],
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: onBook,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Book this room'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
