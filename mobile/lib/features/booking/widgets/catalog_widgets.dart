import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';

class CatalogLoading extends StatelessWidget {
  const CatalogLoading({super.key, this.message = 'Loading…'});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(color: AppColors.primary),
          const SizedBox(height: 16),
          Text(message, style: const TextStyle(color: AppColors.grey600)),
        ],
      ),
    );
  }
}

class CatalogError extends StatelessWidget {
  const CatalogError({
    super.key,
    required this.message,
    this.onRetry,
  });

  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.cloud_off_outlined, size: 56, color: AppColors.grey400),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.grey700),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: onRetry,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                ),
                child: const Text('Retry'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class CatalogEmpty extends StatelessWidget {
  const CatalogEmpty({super.key, required this.message});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Text(
          message,
          textAlign: TextAlign.center,
          style: const TextStyle(color: AppColors.grey600),
        ),
      ),
    );
  }
}

/// Network photo with icon fallback when no upload exists.
class CatalogPhoto extends StatelessWidget {
  const CatalogPhoto({
    super.key,
    required this.images,
    required this.fallbackIcon,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.width,
    this.height,
  });

  final List<String> images;
  final IconData fallbackIcon;
  final BoxFit fit;
  final BorderRadius? borderRadius;
  final double? width;
  final double? height;

  String? get _url => images.isNotEmpty ? images.first : null;

  @override
  Widget build(BuildContext context) {
    final radius = borderRadius ?? BorderRadius.zero;
    final url = _url;

    Widget child;
    if (url == null) {
      child = ColoredBox(
        color: AppColors.primary.withValues(alpha: 0.08),
        child: Center(
          child: Icon(fallbackIcon, color: AppColors.primary, size: 36),
        ),
      );
    } else {
      child = CachedNetworkImage(
        imageUrl: url,
        fit: fit,
        width: width,
        height: height,
        placeholder: (_, __) => ColoredBox(
          color: AppColors.grey200,
          child: Center(
            child: Icon(fallbackIcon, color: AppColors.grey400, size: 28),
          ),
        ),
        errorWidget: (_, __, ___) => ColoredBox(
          color: AppColors.primary.withValues(alpha: 0.08),
          child: Center(
            child: Icon(fallbackIcon, color: AppColors.primary, size: 36),
          ),
        ),
      );
    }

    return ClipRRect(
      borderRadius: radius,
      child: SizedBox(width: width, height: height, child: child),
    );
  }
}

/// Full-width hero / gallery for detail screens.
class CatalogImageHeader extends StatefulWidget {
  const CatalogImageHeader({
    super.key,
    required this.images,
    required this.fallbackIcon,
    this.height = 220,
  });

  final List<String> images;
  final IconData fallbackIcon;
  final double height;

  @override
  State<CatalogImageHeader> createState() => _CatalogImageHeaderState();
}

class _CatalogImageHeaderState extends State<CatalogImageHeader> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final images = widget.images;

    if (images.isEmpty) {
      return SizedBox(
        height: widget.height,
        width: double.infinity,
        child: CatalogPhoto(
          images: const [],
          fallbackIcon: widget.fallbackIcon,
          height: widget.height,
        ),
      );
    }

    return SizedBox(
      height: widget.height,
      width: double.infinity,
      child: Stack(
        fit: StackFit.expand,
        children: [
          PageView.builder(
            itemCount: images.length,
            onPageChanged: (i) => setState(() => _index = i),
            itemBuilder: (context, i) {
              return CachedNetworkImage(
                imageUrl: images[i],
                fit: BoxFit.cover,
                placeholder: (_, __) => Container(color: AppColors.grey200),
                errorWidget: (_, __, ___) => CatalogPhoto(
                  images: const [],
                  fallbackIcon: widget.fallbackIcon,
                ),
              );
            },
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            height: 72,
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.45),
                  ],
                ),
              ),
            ),
          ),
          if (images.length > 1)
            Positioned(
              bottom: 12,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(images.length, (i) {
                  final active = i == _index;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    width: active ? 18 : 7,
                    height: 7,
                    decoration: BoxDecoration(
                      color: active ? Colors.white : Colors.white54,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  );
                }),
              ),
            ),
        ],
      ),
    );
  }
}

/// Destination / inventory card with photo on top.
class CatalogImageCard extends StatelessWidget {
  const CatalogImageCard({
    super.key,
    required this.title,
    required this.images,
    required this.fallbackIcon,
    this.subtitle,
    this.trailing,
    this.onTap,
    this.imageHeight = 140,
  });

  final String title;
  final List<String> images;
  final IconData fallbackIcon;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;
  final double imageHeight;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 0,
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppColors.grey200),
      ),
      child: InkWell(
        onTap: onTap,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            CatalogPhoto(
              images: images,
              fallbackIcon: fallbackIcon,
              height: imageHeight,
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          style: const TextStyle(
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                          ),
                        ),
                        if (subtitle != null && subtitle!.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            subtitle!,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              color: AppColors.grey600,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  if (trailing != null) ...[
                    const SizedBox(width: 8),
                    trailing!,
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Compact horizontal media row for list density.
class CatalogMediaTile extends StatelessWidget {
  const CatalogMediaTile({
    super.key,
    required this.title,
    required this.images,
    required this.fallbackIcon,
    this.subtitle,
    this.trailing,
    this.onTap,
  });

  final String title;
  final List<String> images;
  final IconData fallbackIcon;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      elevation: 0,
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: const BorderSide(color: AppColors.grey200),
      ),
      child: InkWell(
        onTap: onTap,
        child: SizedBox(
          height: 96,
          child: Row(
            children: [
              CatalogPhoto(
                images: images,
                fallbackIcon: fallbackIcon,
                width: 96,
                height: 96,
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(12, 10, 8, 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      if (subtitle != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          subtitle!,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: AppColors.grey600,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              if (trailing != null)
                Padding(
                  padding: const EdgeInsets.only(right: 12),
                  child: trailing!,
                )
              else
                const Padding(
                  padding: EdgeInsets.only(right: 8),
                  child: Icon(Icons.chevron_right, color: AppColors.grey400),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

@Deprecated('Use CatalogMediaTile or CatalogImageCard')
class CatalogListTile extends StatelessWidget {
  const CatalogListTile({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
    this.images = const [],
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;
  final List<String> images;

  @override
  Widget build(BuildContext context) {
    return CatalogMediaTile(
      title: title,
      subtitle: subtitle,
      images: images,
      fallbackIcon: icon,
      trailing: trailing,
      onTap: onTap,
    );
  }
}

class PriceTag extends StatelessWidget {
  const PriceTag({
    super.key,
    required this.amount,
    this.currency = 'ETB',
    this.suffix,
  });

  final double amount;
  final String currency;
  final String? suffix;

  @override
  Widget build(BuildContext context) {
    final text = suffix == null
        ? '${amount.toStringAsFixed(0)} $currency'
        : '${amount.toStringAsFixed(0)} $currency$suffix';
    return Text(
      text,
      style: const TextStyle(
        color: AppColors.primary,
        fontWeight: FontWeight.bold,
      ),
    );
  }
}
