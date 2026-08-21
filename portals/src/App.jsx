import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";

import Login from "./pages/auth/Login";
import AdminLogin from "./pages/auth/AdminLogin";
import Register from "./pages/auth/Register";
import ProviderRegistrationSelect from "./pages/auth/ProviderRegistrationSelect";

import HotelLayout from "./layouts/HotelLayout";
import AgencyLayout from "./layouts/AgencyLayout";
import CarRentalLayout from "./layouts/CarRentalLayout";
import DriverLayout from "./layouts/DriverLayout";
import MarketplaceLayout from "./layouts/MarketplaceLayout";
import AdminLayout from "./layouts/AdminLayout";

import ProviderDashboard from "./pages/provider/ProviderDashboard";
import ProviderListings from "./pages/provider/ProviderListings";
import ProviderBookings from "./pages/provider/ProviderBookings";
import ProviderPayments from "./pages/provider/ProviderPayments";
import ProviderReviews from "./pages/provider/ProviderReviews";
import ProviderProfile from "./pages/provider/ProviderProfile";
import HotelProperty from "./pages/hotel/HotelProperty";
import MarketplaceBrowse from "./pages/marketplace/MarketplaceBrowse";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProviders from "./pages/admin/AdminProviders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDestinations from "./pages/admin/AdminDestinations";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminSettings from "./pages/admin/AdminSettings";

function ProviderRedirect() {
  return <Navigate to="/login" replace />;
}

const providerPages = (
  <>
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard" element={<ProviderDashboard />} />
    <Route path="listings" element={<ProviderListings />} />
    <Route path="bookings" element={<ProviderBookings />} />
    <Route path="payments" element={<ProviderPayments />} />
    <Route path="reviews" element={<ProviderReviews />} />
    <Route path="profile" element={<ProviderProfile />} />
  </>
);

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/register" element={<ProviderRegistrationSelect />} />
      <Route path="/register/:providerType" element={<Register />} />

      <Route path="/provider/*" element={<ProviderRedirect />} />

      <Route element={<ProtectedRoute allowedRoles={["HOTEL_PROVIDER"]} />}>
        <Route path="/hotel" element={<HotelLayout />}>
          {providerPages}
          <Route path="property" element={<HotelProperty />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["TOUR_AGENCY"]} />}>
        <Route path="/agency" element={<AgencyLayout />}>
          {providerPages}
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["CAR_RENTAL"]} />}>
        <Route path="/car-rental" element={<CarRentalLayout />}>
          {providerPages}
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["DRIVER", "GUIDE"]} />}>
        <Route path="/driver" element={<DriverLayout />}>
          {providerPages}
        </Route>
      </Route>

      <Route path="/marketplace" element={<MarketplaceLayout />}>
        <Route index element={<MarketplaceBrowse />} />
        <Route path=":entity" element={<MarketplaceBrowse />} />
      </Route>

      <Route
        element={
          <ProtectedRoute allowedRoles={["ADMIN"]} loginPath="/admin/login" />
        }
      >
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="providers" element={<AdminProviders />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="destinations" element={<AdminDestinations />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Route>

      <Route
        path="/unauthorized"
        element={<div className="p-10 text-center">Not authorized.</div>}
      />
      <Route path="*" element={<div className="p-10 text-center">404 — Page not found.</div>} />
    </Routes>
  );
}
