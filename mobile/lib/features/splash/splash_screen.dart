import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/providers/user_provider.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    // Wait 2.5 seconds, then navigate automatically
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        final authState = ref.read(userProvider);
        if (authState.isAuthenticated) {
          context.go('/home');
        } else {
          context.go('/login');
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // App Logo
            const Icon(
              Icons.map_outlined,
              size: 80,
              color: AppColors.primary,
            ),
            const SizedBox(height: 24),

            // App Name
            const Text(
              'Pagume Trip',
              style: TextStyle(
                fontSize: 36,
                fontWeight: FontWeight.bold,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 8),

            // Tagline
            const Text(
              'Curated discovery awaits.',
              style: TextStyle(
                fontSize: 16,
                color: AppColors.grey600,
              ),
            ),
            const SizedBox(height: 48),

            // Loading Indicator
            const CircularProgressIndicator(
              color: AppColors.primary,
            ),
          ],
        ),
      ),
    );
  }
}