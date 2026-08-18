import {
  LayoutDashboard,
  Package,
  CalendarCheck,
  Wallet,
  Star,
  Settings,
  Building2,
  Users,
  MapPin,
  BarChart3,
} from "lucide-react";

export const providerNavItems = [
  { label: "Dashboard", path: "/provider/dashboard", icon: LayoutDashboard },
  { label: "My Listings", path: "/provider/listings", icon: Package },
  { label: "Bookings", path: "/provider/bookings", icon: CalendarCheck },
  { label: "Payments & Earnings", path: "/provider/payments", icon: Wallet },
  { label: "Reviews", path: "/provider/reviews", icon: Star },
  { label: "Profile & Settings", path: "/provider/profile", icon: Settings },
];

export const adminNavItems = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Provider Management", path: "/admin/providers", icon: Building2 },
  { label: "User Management", path: "/admin/users", icon: Users },
  { label: "Destinations", path: "/admin/destinations", icon: MapPin },
  { label: "Bookings Overview", path: "/admin/bookings", icon: CalendarCheck },
  { label: "Payments & Transactions", path: "/admin/payments", icon: Wallet },
  { label: "Reports & Analytics", path: "/admin/reports", icon: BarChart3 },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];

