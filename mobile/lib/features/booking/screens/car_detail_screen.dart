import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/catalog_api.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/providers/manual_booking_provider.dart';
import '../../../core/providers/media_index_provider.dart';
import '../../../data/models/vehicle.dart';
import '../widgets/catalog_widgets.dart';

/// Loads vehicle via destination car-rentals list (no dedicated GET by id).
class CarDetailScreen extends ConsumerStatefulWidget {
  const CarDetailScreen({
    super.key,
    required this.vehicleId,
    this.destinationId,
  });

  final String vehicleId;
  final String? destinationId;

  @override
  ConsumerState<CarDetailScreen> createState() => _CarDetailScreenState();
}

class _CarDetailScreenState extends ConsumerState<CarDetailScreen> {
  Vehicle? _vehicle;
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = CatalogApi();
      Vehicle? found;

      if (widget.destinationId != null && widget.destinationId!.isNotEmpty) {
        final list = await api.listCarRentals(
          destinationId: widget.destinationId!,
        );
        for (final v in list) {
          if (v.id == widget.vehicleId) {
            found = v;
            break;
          }
        }
      }

      if (found == null) {
        final destinations = await api.listDestinations();
        for (final d in destinations) {
          final list = await api.listCarRentals(destinationId: d.id);
          for (final v in list) {
            if (v.id == widget.vehicleId) {
              found = v;
              break;
            }
          }
          if (found != null) break;
        }
      }

      if (found != null) {
        try {
          final media = await ref.read(catalogMediaIndexProvider.future);
          final urls = media.forVehicle(
            name: found.displayName,
            agentId: found.id,
          );
          if (urls.isNotEmpty) {
            found = found.copyWith(images: urls);
          }
        } catch (_) {}
      }

      if (!mounted) return;
      if (found == null) {
        setState(() {
          _loading = false;
          _error = 'Vehicle not found.';
        });
      } else {
        setState(() {
          _loading = false;
          _vehicle = found;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Car rental')),
        body: const CatalogLoading(),
      );
    }
    if (_error != null || _vehicle == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Car rental')),
        body: CatalogError(message: _error ?? 'Not found', onRetry: _load),
      );
    }

    final v = _vehicle!;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 240,
            pinned: true,
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            title: Text(v.displayName),
            flexibleSpace: FlexibleSpaceBar(
              background: CatalogImageHeader(
                images: v.images,
                fallbackIcon: Icons.directions_car_outlined,
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
                            Text(
                              '${v.make} ${v.model}${v.year != null ? ' (${v.year})' : ''}',
                            ),
                            Text(
                              '${v.seats} seats · ${v.transmission} · ${v.fuelType}',
                            ),
                            if (v.is4wd) const Text('4WD'),
                            if (v.driverIncluded) const Text('Driver included'),
                            if (v.pickupLocation.isNotEmpty)
                              Text('Pickup: ${v.pickupLocation}'),
                          ],
                        ),
                      ),
                      PriceTag(
                        amount: v.dailyPriceEtb,
                        currency: v.currency,
                        suffix: '/day',
                      ),
                    ],
                  ),
                  if (v.insurance.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Text('Insurance: ${v.insurance}'),
                  ],
                  if (v.depositEtb > 0) ...[
                    const SizedBox(height: 8),
                    Text(
                      'Deposit: ${v.depositEtb.toStringAsFixed(0)} ${v.currency}',
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
                            .startVehicleCheckout(vehicle: v);
                        context.push('/booking/checkout');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                      ),
                      child: const Text('Rent this vehicle'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
