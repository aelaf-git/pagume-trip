import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,

      // ============================================================
      // APP BAR
      // ============================================================

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

        actions: [
          IconButton(
            onPressed: () {},
            icon: const Icon(
              Icons.notifications_none_rounded,
              color: Color(0xFF087F3D),
              size: 29,
            ),
          ),
          const SizedBox(width: 8),
        ],
      ),

      // ============================================================
      // HOME CONTENT
      // ============================================================

      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [

              // ======================================================
              // LARGE PAGUME TRIP LOGO
              // ======================================================

              Center(
                child: Padding(
                  padding: const EdgeInsets.only(
                    top: 5,
                    left: 20,
                    right: 20,
                  ),

                  child: Image.asset(
                    'assets/images/pagume_logo.png',

                    // This makes the WHOLE logo larger.
                    // The Walia ibex inside the image is not changed.
                    width: 300,
                    height: 300,

                    fit: BoxFit.contain,
                  ),
                ),
              ),

              // ======================================================
              // DISCOVER ETHIOPIA
              // ======================================================

              const Padding(
                padding: EdgeInsets.fromLTRB(
                  32,
                  5,
                  32,
                  0,
                ),

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

              // ======================================================
              // SEARCH BAR
              // ======================================================

              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),

                child: Container(
                  height: 58,

                  decoration: BoxDecoration(
                    color: Colors.white,

                    borderRadius: BorderRadius.circular(16),

                    border: Border.all(
                      color: const Color(0xFFE5E5E5),
                    ),

                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.06),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),

                  child: TextField(
                    decoration: InputDecoration(
                      hintText: 'Search destinations, tours...',

                      hintStyle: const TextStyle(
                        color: Color(0xFF9E9E9E),
                        fontSize: 16,
                      ),

                      prefixIcon: const Icon(
                        Icons.search_rounded,
                        color: Color(0xFF087F3D),
                        size: 29,
                      ),

                      border: InputBorder.none,

                      contentPadding: const EdgeInsets.symmetric(
                        vertical: 17,
                      ),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 18),

              // ======================================================
              // EXPLORE ETHIOPIA BUTTON
              // ======================================================

              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),

                child: SizedBox(
                  width: double.infinity,
                  height: 58,

                  child: ElevatedButton.icon(
                    onPressed: () {},

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

              // ======================================================
              // PLAN YOUR JOURNEY
              // ======================================================

              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 32),

                child: Text(
                  'Plan your journey',
                  style: TextStyle(
                    color: Color(0xFF202020),
                    fontSize: 21,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),

              const SizedBox(height: 15),

              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),

                child: Row(
                  children: [

                    Expanded(
                      child: _serviceCard(
                        icon: Icons.flight_takeoff_rounded,
                        title: 'Flights',
                      ),
                    ),

                    const SizedBox(width: 12),

                    Expanded(
                      child: _serviceCard(
                        icon: Icons.hotel_outlined,
                        title: 'Hotels',
                      ),
                    ),

                    const SizedBox(width: 12),

                    Expanded(
                      child: _serviceCard(
                        icon: Icons.location_on_outlined,
                        title: 'Places',
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 30),

              // ======================================================
              // POPULAR DESTINATIONS
              // ======================================================

              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),

                child: Row(
                  mainAxisAlignment:
                  MainAxisAlignment.spaceBetween,

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
                      onPressed: () {},

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

                child: ListView(
                  scrollDirection: Axis.horizontal,

                  padding: const EdgeInsets.symmetric(
                    horizontal: 32,
                  ),

                  children: [

                    _destinationCard(
                      'Lalibela',
                      'Historic Ethiopia',
                      Icons.account_balance_outlined,
                    ),

                    const SizedBox(width: 14),

                    _destinationCard(
                      'Gondar',
                      'Castles & culture',
                      Icons.castle_outlined,
                    ),

                    const SizedBox(width: 14),

                    _destinationCard(
                      'Axum',
                      'Ancient history',
                      Icons.history_edu_outlined,
                    ),

                    const SizedBox(width: 14),

                    _destinationCard(
                      'Arba Minch',
                      'Nature & lakes',
                      Icons.landscape_outlined,
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 35),

              // ======================================================
              // AI TRAVEL ASSISTANT
              // ======================================================

              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),

                child: Container(
                  width: double.infinity,

                  padding: const EdgeInsets.all(20),

                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F8F3),

                    borderRadius: BorderRadius.circular(20),

                    border: Border.all(
                      color: const Color(0xFFD6EBDD),
                    ),
                  ),

                  child: Row(
                    children: [

                      Container(
                        width: 55,
                        height: 55,

                        decoration: BoxDecoration(
                          color: const Color(0xFF087F3D),
                          borderRadius:
                          BorderRadius.circular(16),
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
                          crossAxisAlignment:
                          CrossAxisAlignment.start,

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

              const SizedBox(height: 35),
            ],
          ),
        ),
      ),
    );
  }

  // ================================================================
  // SERVICE CARD
  // ================================================================

  static Widget _serviceCard({
    required IconData icon,
    required String title,
  }) {
    return Container(
      height: 105,

      decoration: BoxDecoration(
        color: Colors.white,

        borderRadius: BorderRadius.circular(16),

        border: Border.all(
          color: const Color(0xFFE5E5E5),
        ),

        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),

      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,

        children: [

          Icon(
            icon,
            color: const Color(0xFF087F3D),
            size: 30,
          ),

          const SizedBox(height: 9),

          Text(
            title,
            style: const TextStyle(
              color: Color(0xFF333333),
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  // ================================================================
  // DESTINATION CARD
  // ================================================================

  static Widget _destinationCard(
      String title,
      String subtitle,
      IconData icon,
      ) {
    return Container(
      width: 170,

      padding: const EdgeInsets.all(16),

      decoration: BoxDecoration(
        color: const Color(0xFF087F3D),

        borderRadius: BorderRadius.circular(18),
      ),

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

            child: Icon(
              icon,
              color: Colors.black87,
              size: 25,
            ),
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
    );
  }
}