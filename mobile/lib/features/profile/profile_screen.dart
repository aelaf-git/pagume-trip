import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  // Controllers for user input
  final TextEditingController _nameController = TextEditingController(text: 'Traveler');
  final TextEditingController _emailController = TextEditingController(text: 'traveler@pagume.com');

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,

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
            // DISPLAY USER NAME (UPDATES LIVE)
            // ======================================================

            Text(
              _nameController.text.isEmpty ? 'Traveler' : _nameController.text,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 6),

            // ======================================================
            // DISPLAY USER EMAIL (UPDATES LIVE)
            // ======================================================

            Text(
              _emailController.text.isEmpty ? 'traveler@pagume.com' : _emailController.text,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                color: AppColors.grey600,
              ),
            ),

            const SizedBox(height: 30),

            // ======================================================
            // EDIT PROFILE SECTION
            // ======================================================

            _buildSectionTitle('Edit Profile'),

            const SizedBox(height: 15),

            // Name Input
            TextField(
              controller: _nameController,
              onChanged: (value) {
                setState(() {}); // Updates the screen live
              },
              decoration: InputDecoration(
                labelText: 'Your Name',
                prefixIcon: const Icon(Icons.person_outline),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),

            const SizedBox(height: 15),

            // Email Input
            TextField(
              controller: _emailController,
              onChanged: (value) {
                setState(() {}); // Updates the screen live
              },
              keyboardType: TextInputType.emailAddress,
              decoration: InputDecoration(
                labelText: 'Your Email',
                prefixIcon: const Icon(Icons.email_outlined),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
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
                context.go('/trips');
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

            const Text(
              'Pagume Trip',
              style: TextStyle(
                color: AppColors.grey600,
                fontSize: 13,
              ),
            ),

            const SizedBox(height: 4),

            const Text(
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
                Navigator.pop(dialogContext);
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