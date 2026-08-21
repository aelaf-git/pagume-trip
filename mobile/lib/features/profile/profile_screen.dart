import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants/app_colors.dart';
import '../../data/providers/user_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(userProvider);

    return Scaffold(
      backgroundColor: AppColors.background,

      // ==========================================================
      // APP BAR
      // ==========================================================

      appBar: AppBar(
        title: const Text(
          'Profile',
          style: TextStyle(
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),

      // ==========================================================
      // BODY
      // ==========================================================

      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),

        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,

          children: [
            // ======================================================
            // PROFILE AVATAR
            // ======================================================

            Container(
              width: 100,
              height: 100,

              decoration: BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,

                border: Border.all(
                  color: AppColors.accent,
                  width: 3,
                ),
              ),

              child: const Icon(
                Icons.person,
                size: 55,
                color: Colors.white,
              ),
            ),

            const SizedBox(height: 16),

            // ======================================================
            // USER NAME
            // ======================================================

            Text(
              user.name,
              textAlign: TextAlign.center,

              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 6),

            // ======================================================
            // USER EMAIL
            // ======================================================

            Text(
              user.email,
              textAlign: TextAlign.center,

              style: TextStyle(
                fontSize: 14,
                color: AppColors.grey600,
              ),
            ),

            const SizedBox(height: 30),

            // ======================================================
            // ACCOUNT SECTION
            // ======================================================

            _buildSectionTitle('Account'),

            const SizedBox(height: 10),

            _buildProfileItem(
              context: context,
              icon: Icons.person_outline,
              title: 'Edit Profile',
              subtitle: 'Update your personal information',
              onTap: () {
                _showMessage(
                  context,
                  'Edit Profile coming soon',
                );
              },
            ),

            _buildProfileItem(
              context: context,
              icon: Icons.lock_outline,
              title: 'Security',
              subtitle: 'Password and account security',
              onTap: () {
                _showMessage(
                  context,
                  'Security settings coming soon',
                );
              },
            ),

            _buildProfileItem(
              context: context,
              icon: Icons.notifications_none,
              title: 'Notifications',
              subtitle: 'Manage your notifications',
              onTap: () {
                _showMessage(
                  context,
                  'Notification settings coming soon',
                );
              },
            ),

            const SizedBox(height: 24),

            // ======================================================
            // TRAVEL SECTION
            // ======================================================

            _buildSectionTitle('Travel'),

            const SizedBox(height: 10),

            _buildProfileItem(
              context: context,
              icon: Icons.map_outlined,
              title: 'My Trips',
              subtitle: 'View your saved trips',
              onTap: () {
                context.go('/trip-planner');
              },
            ),

            _buildProfileItem(
              context: context,
              icon: Icons.history,
              title: 'Booking History',
              subtitle: 'View your previous bookings',
              onTap: () {
                _showMessage(
                  context,
                  'Booking history coming soon',
                );
              },
            ),

            _buildProfileItem(
              context: context,
              icon: Icons.payment_outlined,
              title: 'Payment Methods',
              subtitle: 'Manage your payment methods',
              onTap: () {
                _showMessage(
                  context,
                  'Payment methods coming soon',
                );
              },
            ),

            const SizedBox(height: 30),

            // ======================================================
            // LOGOUT BUTTON
            // ======================================================

            SizedBox(
              width: double.infinity,

              child: OutlinedButton.icon(
                onPressed: () {
                  _showLogoutDialog(
                    context,
                    ref,
                  );
                },

                icon: const Icon(
                  Icons.logout,
                ),

                label: const Text(
                  'Logout',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),

                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.red,

                  side: const BorderSide(
                    color: Colors.red,
                  ),

                  padding: const EdgeInsets.symmetric(
                    vertical: 14,
                  ),

                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),

            const SizedBox(height: 20),

            // ======================================================
            // APP VERSION
            // ======================================================

            Text(
              'Pagume Trip',
              style: TextStyle(
                color: AppColors.grey600,
                fontSize: 13,
              ),
            ),

            const SizedBox(height: 4),

            Text(
              'Explore • Book • Experience',
              style: TextStyle(
                color: AppColors.grey600,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ==========================================================
  // SECTION TITLE
  // ==========================================================

  Widget _buildSectionTitle(String title) {
    return Align(
      alignment: Alignment.centerLeft,

      child: Text(
        title,

        style: TextStyle(
          color: AppColors.primary,
          fontSize: 18,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  // ==========================================================
  // PROFILE ITEM
  // ==========================================================

  Widget _buildProfileItem({
    required BuildContext context,
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),

      decoration: BoxDecoration(
        color: Colors.white,

        borderRadius: BorderRadius.circular(14),

        border: Border.all(
          color: AppColors.primary.withOpacity(0.1),
        ),
      ),

      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 5,
        ),

        leading: Container(
          width: 44,
          height: 44,

          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),

          child: Icon(
            icon,
            color: AppColors.primary,
          ),
        ),

        title: Text(
          title,
          style: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 15,
          ),
        ),

        subtitle: Text(
          subtitle,
          style: TextStyle(
            color: AppColors.grey600,
            fontSize: 12,
          ),
        ),

        trailing: const Icon(
          Icons.chevron_right,
          color: Colors.grey,
        ),

        onTap: onTap,
      ),
    );
  }

  // ==========================================================
  // LOGOUT DIALOG
  // ==========================================================

  void _showLogoutDialog(
    BuildContext context,
    WidgetRef ref,
  ) {
    showDialog(
      context: context,

      builder: (dialogContext) {
        return AlertDialog(
          title: const Text(
            'Logout?',
          ),

          content: const Text(
            'Are you sure you want to logout?',
          ),

          actions: [
            // KEEP ACCOUNT
            TextButton(
              onPressed: () {
                Navigator.pop(dialogContext);
              },

              child: const Text(
                'Cancel',
              ),
            ),

            // LOGOUT
            ElevatedButton(
              onPressed: () {
                // REQUIRED BY YOUR TEAMMATE
                ref
                    .read(userProvider.notifier)
                    .logout();

                Navigator.pop(dialogContext);

                // Go back to login
                context.go('/login');
              },

              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
              ),

              child: const Text(
                'Logout',
              ),
            ),
          ],
        );
      },
    );
  }

  // ==========================================================
  // MESSAGE
  // ==========================================================

  void _showMessage(
    BuildContext context,
    String message,
  ) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
      ),
    );
  }
}