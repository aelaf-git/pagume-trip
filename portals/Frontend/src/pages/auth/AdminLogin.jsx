import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";

export default function AdminLogin() {
  const { login, logout, isAuthenticating, authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [roleError, setRoleError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRoleError(null);
    try {
      const user = await login(form.email, form.password);
      if (user.role !== "ADMIN") {
        await logout();
        setRoleError("This sign-in is for Pagume administrators only. Providers use the provider login.");
        return;
      }
      const from = location.state?.from?.pathname;
      const redirectTo =
        from && from.startsWith("/admin") && from !== "/admin/login"
          ? from
          : "/admin/dashboard";
      navigate(redirectTo, { replace: true });
    } catch {
      // authError via context
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Shield className="h-8 w-8 text-brand-600" />
          <span className="text-xl font-bold text-gray-900">Pagume Admin</span>
        </div>

        <Card title="Administrator sign in">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="admin-email"
              label="Email"
              type="email"
              placeholder="admin@pagume.et"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <Input
              id="admin-password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
            />

            {(roleError || authError) && (
              <p className="text-sm text-red-500">{roleError || authError}</p>
            )}

            <Button type="submit" className="w-full" loading={isAuthenticating}>
              Sign in
            </Button>
          </form>
        </Card>

        <p className="text-sm text-center text-gray-500 mt-4">
          Tourism provider?{" "}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">
            Provider login
          </Link>
        </p>
      </div>
    </div>
  );
}
