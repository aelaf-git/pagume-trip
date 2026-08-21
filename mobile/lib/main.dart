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
    // Watch for auth state changes
    final authState = ref.watch(userProvider);
    final isAuthenticated = authState.isAuthenticated;

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

// MainScreen with Bottom Navigation (Updated for StatefulShellRoute)
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

// GoRouter Configuration with Auth Redirect and Stateful Shell
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

    // StatefulShellRoute (Auto-syncs navigation)
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) {
        return MainScreen(navigationShell: navigationShell);
      },
      branches: [
        // 1. Home Tab
        StatefulShellBranch(
          routes: <RouteBase>[
            GoRoute(
              path: '/home',
              name: 'home',
              builder: (context, state) => const HomeScreen(),
            ),
          ],
        ),
        // 2. Chat Tab
        StatefulShellBranch(
          routes: <RouteBase>[
            GoRoute(
              path: '/chat',
              name: 'chat',
              builder: (context, state) => const ChatScreen(),
            ),
          ],
        ),
        // 3. Trips Tab
        StatefulShellBranch(
          routes: <RouteBase>[
            GoRoute(
              path: '/trips',
              name: 'trips',
              builder: (context, state) => const TripPlannerScreen(),
            ),
          ],
        ),
        // 4. Booking Tab
        StatefulShellBranch(
          routes: <RouteBase>[
            GoRoute(
              path: '/booking',
              name: 'booking',
              builder: (context, state) => const BookingScreen(),
            ),
          ],
        ),
        // 5. Profile Tab
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