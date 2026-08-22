import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'core/constants/app_colors.dart';
import 'core/providers/user_provider.dart';
import 'features/home/home_screen.dart';
import 'features/ai_chat/screens/chat_screen.dart';
import 'features/trip_planner/trip_planner_screen.dart';
import 'features/profile/profile_screen.dart';
import 'features/splash/splash_screen.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/auth/screens/signup_screen.dart';
import 'features/booking/booking_screen.dart';
import 'features/booking/screens/destination_detail_screen.dart';
import 'features/booking/screens/hotel_detail_screen.dart';
import 'features/booking/screens/tour_detail_screen.dart';
import 'features/booking/screens/car_detail_screen.dart';
import 'features/booking/screens/checkout_screen.dart';
import 'features/booking/screens/confirmation_screen.dart';

void main() {
  runApp(
    const ProviderScope(
      child: PagumeTripApp(),
    ),
  );
}

class PagumeTripApp extends ConsumerWidget {
  const PagumeTripApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(userProvider);

    return MaterialApp.router(
      title: 'Pagume Trip',
      theme: ThemeData(
        primaryColor: AppColors.primary,
        primarySwatch: Colors.green,
        useMaterial3: true,
        scaffoldBackgroundColor: AppColors.background,
        appBarTheme: const AppBarTheme(
          backgroundColor: AppColors.primary,
          foregroundColor: Colors.white,
          elevation: 0,
          centerTitle: true,
        ),
      ),
      debugShowCheckedModeBanner: false,
      routerConfig: _router,
    );
  }
}

class MainScreen extends StatefulWidget {
  const MainScreen({super.key, required this.navigationShell});
  final StatefulNavigationShell navigationShell;

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: widget.navigationShell,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: widget.navigationShell.currentIndex,
        onTap: (index) {
          widget.navigationShell.goBranch(index);
        },
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppColors.primary,
        unselectedItemColor: AppColors.grey500,
        backgroundColor: Colors.white,
        elevation: 0,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.chat_outlined),
            activeIcon: Icon(Icons.chat),
            label: 'AI Chat',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.trip_origin_outlined),
            activeIcon: Icon(Icons.trip_origin),
            label: 'My Trips',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.edit_note_outlined),
            activeIcon: Icon(Icons.edit_note),
            label: 'Book',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}

final GoRouter _router = GoRouter(
  initialLocation: '/',
  redirect: (context, state) {
    final authState = ProviderScope.containerOf(context).read(userProvider);
    final isAuthenticated = authState.isAuthenticated;
    final isOnAuthScreen = state.matchedLocation == '/login' ||
        state.matchedLocation == '/signup' ||
        state.matchedLocation == '/';

    if (!isAuthenticated && !isOnAuthScreen) {
      return '/login';
    }
    if (isAuthenticated && isOnAuthScreen) {
      return '/home';
    }
    return null;
  },
  routes: [
    GoRoute(
      path: '/',
      name: 'splash',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/login',
      name: 'login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/signup',
      name: 'signup',
      builder: (context, state) => const SignupScreen(),
    ),
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) {
        return MainScreen(navigationShell: navigationShell);
      },
      branches: [
        StatefulShellBranch(
          routes: <RouteBase>[
            GoRoute(
              path: '/home',
              name: 'home',
              builder: (context, state) => const HomeScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: <RouteBase>[
            GoRoute(
              path: '/chat',
              name: 'chat',
              builder: (context, state) => const ChatScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: <RouteBase>[
            GoRoute(
              path: '/trips',
              name: 'trips',
              builder: (context, state) => const TripPlannerScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: <RouteBase>[
            GoRoute(
              path: '/booking',
              name: 'booking',
              builder: (context, state) => const BookingScreen(),
              routes: [
                GoRoute(
                  path: 'destinations/:id',
                  name: 'destinationDetail',
                  builder: (context, state) => DestinationDetailScreen(
                    destinationId: state.pathParameters['id']!,
                  ),
                ),
                GoRoute(
                  path: 'hotels/:id',
                  name: 'hotelDetail',
                  builder: (context, state) => HotelDetailScreen(
                    hotelId: state.pathParameters['id']!,
                  ),
                ),
                GoRoute(
                  path: 'tours/:id',
                  name: 'tourDetail',
                  builder: (context, state) => TourDetailScreen(
                    tourId: state.pathParameters['id']!,
                  ),
                ),
                GoRoute(
                  path: 'cars/:id',
                  name: 'carDetail',
                  builder: (context, state) => CarDetailScreen(
                    vehicleId: state.pathParameters['id']!,
                    destinationId: state.uri.queryParameters['destinationId'],
                  ),
                ),
                GoRoute(
                  path: 'checkout',
                  name: 'checkout',
                  builder: (context, state) => const CheckoutScreen(),
                ),
                GoRoute(
                  path: 'confirmation',
                  name: 'confirmation',
                  builder: (context, state) => const ConfirmationScreen(),
                ),
              ],
            ),
          ],
        ),
        StatefulShellBranch(
          routes: <RouteBase>[
            GoRoute(
              path: '/profile',
              name: 'profile',
              builder: (context, state) => const ProfileScreen(),
            ),
          ],
        ),
      ],
    ),
  ],
);
