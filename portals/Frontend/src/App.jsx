import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ProviderRegistrationSelect from "./pages/auth/ProviderRegistrationSelect";

import ProviderLayout from "./layouts/ProviderLayout";
import ProviderDashboard from "./pages/provider/ProviderDashboard";
import ProviderListings from "./pages/provider/ProviderListings";
import ProviderBookings from "./pages/provider/ProviderBookings";
import ProviderPayments from "./pages/provider/ProviderPayments";
import ProviderReviews from "./pages/provider/ProviderReviews";
import ProviderProfile from "./pages/provider/ProviderProfile";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProviders from "./pages/admin/AdminProviders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDestinations from "./pages/admin/AdminDestinations";
import AdminBookings from "./pages/admin/AdminBookings";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<ProviderRegistrationSelect />} />
      <Route path="/register/:providerType" element={<Register />} />

      {/* Provider portal */}
      <Route element={<ProtectedRoute allowedRoles={["provider"]} />}>
        <Route path="/provider" element={<ProviderLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ProviderDashboard />} />
          <Route path="listings" element={<ProviderListings />} />
          <Route path="bookings" element={<ProviderBookings />} />
          <Route path="payments" element={<ProviderPayments />} />
          <Route path="reviews" element={<ProviderReviews />} />
          <Route path="profile" element={<ProviderProfile />} />
        </Route>
      </Route>

      {/* Admin portal */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="providers" element={<AdminProviders />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="destinations" element={<AdminDestinations />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Route>

      <Route path="/unauthorized" element={<div className="p-10 text-center">Not authorized.</div>} />
      <Route path="*" element={<div className="p-10 text-center">404 — Page not found.</div>} />
    </Routes>
  );
}
