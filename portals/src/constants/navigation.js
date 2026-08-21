import {
  LayoutDashboard,
  CalendarCheck,
  Wallet,
  Star,
  Settings,
  Building2,
  Users,
  MapPin,
  BedDouble,
  Compass,
  CarFront,
  UserRound,
  Store,
} from "lucide-react";

export const hotelNavItems = [
  { label: "Dashboard", path: "/hotel/dashboard", icon: LayoutDashboard },
  { label: "Property", path: "/hotel/property", icon: Building2 },
  { label: "Rooms", path: "/hotel/listings", icon: BedDouble },
  { label: "Bookings", path: "/hotel/bookings", icon: CalendarCheck },
  { label: "Payments", path: "/hotel/payments", icon: Wallet },
  { label: "Reviews", path: "/hotel/reviews", icon: Star },
];

export const agencyNavItems = [
  { label: "Dashboard", path: "/agency/dashboard", icon: LayoutDashboard },
  { label: "Packages", path: "/agency/listings", icon: Compass },
  { label: "Bookings", path: "/agency/bookings", icon: CalendarCheck },
  { label: "Payments", path: "/agency/payments", icon: Wallet },
  { label: "Reviews", path: "/agency/reviews", icon: Star },
];

export const carRentalNavItems = [
  { label: "Dashboard", path: "/car-rental/dashboard", icon: LayoutDashboard },
  { label: "Fleet", path: "/car-rental/listings", icon: CarFront },
  { label: "Bookings", path: "/car-rental/bookings", icon: CalendarCheck },
  { label: "Payments", path: "/car-rental/payments", icon: Wallet },
  { label: "Reviews", path: "/car-rental/reviews", icon: Star },
];

export const driverNavItems = [
  { label: "Dashboard", path: "/driver/dashboard", icon: LayoutDashboard },
  { label: "My Profile", path: "/driver/listings", icon: UserRound },
  { label: "Bookings", path: "/driver/bookings", icon: CalendarCheck },
  { label: "Payments", path: "/driver/payments", icon: Wallet },
  { label: "Reviews", path: "/driver/reviews", icon: Star },
];

export const marketplaceNavItems = [
  { label: "All listings", path: "/marketplace", icon: Store },
  { label: "Destinations", path: "/marketplace/destinations", icon: MapPin },
  { label: "Hotels", path: "/marketplace/hotels", icon: Building2 },
  { label: "Tours", path: "/marketplace/tours", icon: Compass },
  { label: "Cars", path: "/marketplace/cars", icon: CarFront },
  { label: "Drivers", path: "/marketplace/drivers", icon: UserRound },
];

export const providerNavItems = [
  { label: "Dashboard", path: "/provider/dashboard", icon: LayoutDashboard },
  { label: "Bookings", path: "/provider/bookings", icon: CalendarCheck },
  { label: "Payments", path: "/provider/payments", icon: Wallet },
  { label: "Reviews", path: "/provider/reviews", icon: Star },
];

export const adminNavItems = [
  { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Provider Management", path: "/admin/providers", icon: Building2 },
  { label: "User Management", path: "/admin/users", icon: Users },
  { label: "Destinations", path: "/admin/destinations", icon: MapPin },
  { label: "Bookings Overview", path: "/admin/bookings", icon: CalendarCheck },
  { label: "Payments & Transactions", path: "/admin/payments", icon: Wallet },
  { label: "Settings", path: "/admin/settings", icon: Settings },
];
