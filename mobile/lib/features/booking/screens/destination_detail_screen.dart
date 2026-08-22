import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/providers/catalog_provider.dart';
import '../widgets/catalog_widgets.dart';

class DestinationDetailScreen extends ConsumerStatefulWidget {
  const DestinationDetailScreen({super.key, required this.destinationId});

  final String destinationId;

  @override
  ConsumerState<DestinationDetailScreen> createState() =>
      _DestinationDetailScreenState();
}

class _DestinationDetailScreenState
    extends ConsumerState<DestinationDetailScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final destAsync = ref.watch(destinationProvider(widget.destinationId));
    final filter = CatalogFilter(destinationId: widget.destinationId);

    return destAsync.when(
      loading: () => Scaffold(
        appBar: AppBar(title: const Text('Destination')),
        body: const CatalogLoading(),
      ),
      error: (e, _) => Scaffold(
        appBar: AppBar(title: const Text('Destination')),
        body: CatalogError(
          message: e.toString(),
          onRetry: () =>
              ref.invalidate(destinationProvider(widget.destinationId)),
        ),
      ),
      data: (dest) {
        return Scaffold(
          backgroundColor: AppColors.background,
          body: NestedScrollView(
            headerSliverBuilder: (context, inner) {
              return [
                SliverAppBar(
                  expandedHeight: 220,
                  pinned: true,
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  title: Text(dest.name),
                  flexibleSpace: FlexibleSpaceBar(
                    background: CatalogImageHeader(
                      images: dest.images,
                      fallbackIcon: Icons.place_outlined,
                      height: 280,
                    ),
                  ),
                  bottom: TabBar(
                    controller: _tabs,
                    indicatorColor: Colors.white,
                    labelColor: Colors.white,
                    unselectedLabelColor: Colors.white70,
                    tabs: const [
                      Tab(text: 'Hotels'),
                      Tab(text: 'Packages'),
                      Tab(text: 'Cars'),
                    ],
                  ),
                ),
              ];
            },
            body: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                if (dest.description.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
                    child: Text(
                      dest.description,
                      style: const TextStyle(color: AppColors.grey700),
                    ),
                  ),
                Expanded(
                  child: TabBarView(
                    controller: _tabs,
                    children: [
                      _HotelsTab(filter: filter),
                      _ToursTab(filter: filter),
                      _CarsTab(filter: filter),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _HotelsTab extends ConsumerWidget {
  const _HotelsTab({required this.filter});
  final CatalogFilter filter;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(hotelsProvider(filter));
    return async.when(
      loading: () => const CatalogLoading(message: 'Loading hotels…'),
      error: (e, _) => CatalogError(
        message: e.toString(),
        onRetry: () => ref.invalidate(hotelsProvider(filter)),
      ),
      data: (hotels) {
        if (hotels.isEmpty) {
          return const CatalogEmpty(message: 'No hotels for this destination.');
        }
        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async => ref.invalidate(hotelsProvider(filter)),
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: hotels.length,
            itemBuilder: (context, i) {
              final h = hotels[i];
              return CatalogMediaTile(
                images: h.images,
                fallbackIcon: Icons.hotel_outlined,
                title: h.name,
                subtitle: [
                  if (h.comfortLevel.isNotEmpty) h.comfortLevel,
                  if (h.rating > 0) '★ ${h.rating.toStringAsFixed(1)}',
                  if (h.description.isNotEmpty) h.description,
                ].join(' · '),
                trailing: h.rooms.isNotEmpty
                    ? PriceTag(amount: h.startingPrice, suffix: '/night')
                    : null,
                onTap: () => context.push('/booking/hotels/${h.id}'),
              );
            },
          ),
        );
      },
    );
  }
}

class _ToursTab extends ConsumerWidget {
  const _ToursTab({required this.filter});
  final CatalogFilter filter;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(toursProvider(filter));
    return async.when(
      loading: () => const CatalogLoading(message: 'Loading packages…'),
      error: (e, _) => CatalogError(
        message: e.toString(),
        onRetry: () => ref.invalidate(toursProvider(filter)),
      ),
      data: (tours) {
        if (tours.isEmpty) {
          return const CatalogEmpty(
            message: 'No tour packages for this destination.',
          );
        }
        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async => ref.invalidate(toursProvider(filter)),
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: tours.length,
            itemBuilder: (context, i) {
              final t = tours[i];
              return CatalogMediaTile(
                images: t.images,
                fallbackIcon: Icons.tour_outlined,
                title: t.name,
                subtitle: '${t.durationLabel} · ${t.category}',
                trailing: PriceTag(amount: t.priceEtb, currency: t.currency),
                onTap: () => context.push('/booking/tours/${t.id}'),
              );
            },
          ),
        );
      },
    );
  }
}

class _CarsTab extends ConsumerWidget {
  const _CarsTab({required this.filter});
  final CatalogFilter filter;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final async = ref.watch(vehiclesProvider(filter));
    return async.when(
      loading: () => const CatalogLoading(message: 'Loading vehicles…'),
      error: (e, _) => CatalogError(
        message: e.toString(),
        onRetry: () => ref.invalidate(vehiclesProvider(filter)),
      ),
      data: (vehicles) {
        if (vehicles.isEmpty) {
          return const CatalogEmpty(
            message: 'No car rentals for this destination.',
          );
        }
        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async => ref.invalidate(vehiclesProvider(filter)),
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: vehicles.length,
            itemBuilder: (context, i) {
              final v = vehicles[i];
              return CatalogMediaTile(
                images: v.images,
                fallbackIcon: Icons.directions_car_outlined,
                title: v.displayName,
                subtitle:
                    '${v.seats} seats · ${v.transmission}${v.is4wd ? ' · 4WD' : ''}'
                    '${v.driverIncluded ? ' · driver included' : ''}',
                trailing: PriceTag(
                  amount: v.dailyPriceEtb,
                  currency: v.currency,
                  suffix: '/day',
                ),
                onTap: () => context.push(
                  '/booking/cars/${v.id}?destinationId=${filter.destinationId}',
                ),
              );
            },
          ),
        );
      },
    );
  }
}
