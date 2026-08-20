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
  BedDouble,
  Compass,
  CarFront,
  UserRound,
  Store,
} from "lucide-react";

function providerNav(prefix) {
  return [
    { label: "Dashboard", path: `/${prefix}/dashboard`, icon: LayoutDashboard },
    { label: "My Listings", path: `/${prefix}/listings`, icon: Package },
    { label: "Bookings", path: `/${prefix}/bookings`, icon: CalendarCheck },
    { label: "Payments", path: `/${prefix}/payments`, icon: Wallet },
    { label: "Reviews", path: `/${prefix}/reviews`, icon: Star },
    { label: "Profile", path: `/${prefix}/profile`, icon: Settings },
  ];
}

export const hotelNavItems = [
  { label: "Dashboard", path: "/hotel/dashboard", icon: LayoutDashboard },
  { label: "Property", path: "/hotel/property", icon: Building2 },
  { label: "Rooms", path: "/hotel/listings", icon: BedDouble },
  { label: "Bookings", path: "/hotel/bookings", icon: CalendarCheck },
  { label: "Profile", path: "/hotel/profile", icon: Settings },
];

export const agencyNavItems = [
  { label: "Dashboard", path: "/agency/dashboard", icon: LayoutDashboard },
  { label: "Packages", path: "/agency/listings", icon: Compass },
  { label: "Bookings", path: "/agency/bookings", icon: CalendarCheck },
  { label: "Profile", path: "/agency/profile", icon: Settings },
];

export const carRentalNavItems = [
  { label: "Dashboard", path: "/car-rental/dashboard", icon: LayoutDashboard },
  { label: "Fleet", path: "/car-rental/listings", icon: CarFront },
  { label: "Bookings", path: "/car-rental/bookings", icon: CalendarCheck },
  { label: "Profile", path: "/car-rental/profile", icon: Settings },
];

export const driverNavItems = [
  { label: "Dashboard", path: "/driver/dashboard", icon: LayoutDashboard },
  { label: "My Profile", path: "/driver/listings", icon: UserRound },
  { label: "Bookings", path: "/driver/bookings", icon: CalendarCheck },
  { label: "Settings", path: "/driver/profile", icon: Settings },
];

export const marketplaceNavItems = [
  { label: "All listings", path: "/marketplace", icon: Store },
  { label: "Destinations", path: "/marketplace/destinations", icon: MapPin },
  { label: "Hotels", path: "/marketplace/hotels", icon: Building2 },
  { label: "Tours", path: "/marketplace/tours", icon: Compass },
  { label: "Cars", path: "/marketplace/cars", icon: CarFront },
  { label: "Drivers", path: "/marketplace/drivers", icon: UserRound },
];

export const providerNavItems = providerNav("provider");

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
