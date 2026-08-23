import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants/app_colors.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  static const _popularDestinations = [
    (
      id: 'dest_lalibela',
      title: 'Lalibela',
      subtitle: 'Historic Ethiopia',
      icon: Icons.account_balance_outlined,
    ),
    (
      id: 'dest_gondar',
      title: 'Gondar',
      subtitle: 'Castles & culture',
      icon: Icons.castle_outlined,
    ),
    (
      id: 'dest_axum',
      title: 'Axum',
      subtitle: 'Ancient history',
      icon: Icons.history_edu_outlined,
    ),
    (
      id: 'dest_bahir_dar',
      title: 'Bahir Dar',
      subtitle: 'Lakes & falls',
      icon: Icons.landscape_outlined,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: AppColors.primary,
        elevation: 0,
        centerTitle: true,
        title: const Text(
          'Pagume Trip',
          style: TextStyle(
            color: Color(0xFF087F3D),
            fontSize: 22,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Padding(
                  padding: const EdgeInsets.only(top: 5, left: 20, right: 20),
                  child: Image.asset(
                    'assets/images/pagume_logo.png',
                    width: 300,
                    height: 300,
                    fit: BoxFit.contain,
                  ),
                ),
              ),
              const Padding(
                padding: EdgeInsets.fromLTRB(32, 5, 32, 0),
                child: Text(
                  'Discover Ethiopia',
                  style: TextStyle(
                    color: Color(0xFF087F3D),
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 32),
                child: Text(
                  'Explore places, cultures and experiences '
                  'that make Ethiopia unforgettable.',
                  style: TextStyle(
                    color: Color(0xFF6B6B6B),
                    fontSize: 15,
                    height: 1.4,
                  ),
                ),
              ),
              const SizedBox(height: 22),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Container(
                  height: 58,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE5E5E5)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.06),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: TextField(
                    textInputAction: TextInputAction.search,
                    onTap: () => context.go('/booking'),
                    onSubmitted: (_) => context.go('/booking'),
                    decoration: const InputDecoration(
                      hintText: 'Search destinations, tours...',
                      hintStyle: TextStyle(
                        color: Color(0xFF9E9E9E),
                        fontSize: 16,
                      ),
                      prefixIcon: Icon(
                        Icons.search_rounded,
                        color: Color(0xFF087F3D),
                        size: 29,
                      ),
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(vertical: 17),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: SizedBox(
                  width: double.infinity,
                  height: 58,
                  child: ElevatedButton.icon(
                    onPressed: () => context.go('/booking'),
                    icon: const Icon(
                      Icons.explore_outlined,
                      color: Colors.black,
                      size: 25,
                    ),
                    label: const Text(
                      'Explore Ethiopia',
                      style: TextStyle(
                        color: Colors.black,
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFFD000),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(15),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 32),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Popular destinations',
                      style: TextStyle(
                        color: Color(0xFF202020),
                        fontSize: 21,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    TextButton(
                      onPressed: () => context.go('/booking'),
                      child: const Text(
                        'See all',
                        style: TextStyle(
                          color: Color(0xFF087F3D),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 170,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 32),
                  itemCount: _popularDestinations.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 14),
                  itemBuilder: (context, index) {
                    final dest = _popularDestinations[index];
                    return _destinationCard(
                      title: dest.title,
                      subtitle: dest.subtitle,
                      icon: dest.icon,
                      onTap: () =>
                          context.go('/booking/destinations/${dest.id}'),
                    );
                  },
                ),
              ),
              const SizedBox(height: 35),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Material(
                  color: const Color(0xFFF1F8F3),
                  borderRadius: BorderRadius.circular(20),
                  child: InkWell(
                    onTap: () => context.go('/chat'),
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFFD6EBDD)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 55,
                            height: 55,
                            decoration: BoxDecoration(
                              color: const Color(0xFF087F3D),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: const Icon(
                              Icons.auto_awesome_rounded,
                              color: Colors.white,
                              size: 28,
                            ),
                          ),
                          const SizedBox(width: 15),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Your AI Travel Assistant',
                                  style: TextStyle(
                                    fontSize: 17,
                                    fontWeight: FontWeight.bold,
                                    color: Color(0xFF202020),
                                  ),
                                ),
                                SizedBox(height: 5),
                                Text(
                                  'Plan your Ethiopian journey '
                                  'with intelligent assistance.',
                                  style: TextStyle(
                                    color: Color(0xFF6B6B6B),
                                    fontSize: 13,
                                    height: 1.4,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const Icon(
                            Icons.arrow_forward_ios_rounded,
                            color: Color(0xFF087F3D),
                            size: 18,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 35),
            ],
          ),
        ),
      ),
    );
  }

  static Widget _destinationCard({
    required String title,
    required String subtitle,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Material(
      color: const Color(0xFF087F3D),
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          width: 170,
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: const Color(0xFFFFD000),
                  borderRadius: BorderRadius.circular(13),
                ),
                child: Icon(icon, color: Colors.black87, size: 25),
              ),
              const Spacer(),
              Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: TextStyle(
                  color: Colors.white.withOpacity(0.8),
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
