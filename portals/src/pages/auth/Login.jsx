import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { portalPathForRole } from "../../utils/roles";
import BrandLogo from "../../components/common/BrandLogo";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";

export default function Login() {
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
      if (user.role === "ADMIN") {
        await logout();
        setRoleError("Administrators sign in at the admin login page.");
        return;
      }
      const fallback = portalPathForRole(user.role);
      const from = location.state?.from?.pathname;
      const redirectTo =
        from &&
        from !== "/login" &&
        from !== "/unauthorized" &&
        !from.startsWith("/admin")
          ? from
          : fallback;
      navigate(redirectTo, { replace: true });
    } catch {
      // authError via context
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <BrandLogo size="lg" wordmarkClassName="text-xl font-bold text-gray-900" />
        </div>

        <Card title="Sign in to your portal">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              required
            />
            <Input
              id="password"
              label="Password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
            />

            {(roleError || authError) && (
              <p className="text-sm text-red-500">
                {roleError || authError}
                {roleError && (
                  <>
                    {" "}
                    <Link to="/admin/login" className="underline">
                      Admin login
                    </Link>
                  </>
                )}
              </p>
            )}

            <Button type="submit" className="w-full" loading={isAuthenticating}>
              Sign in
            </Button>
          </form>
        </Card>

        <p className="text-sm text-center text-gray-500 mt-4">
          New tourism provider?{" "}
          <Link to="/register" className="text-brand-600 font-medium hover:underline">
            Register your business
          </Link>
        </p>
        <p className="text-xs text-center text-gray-400 mt-2">
          Looking for verified listings?{" "}
          <Link to="/marketplace" className="text-gray-500 underline hover:text-brand-600">
            Public browse
          </Link>
        </p>
      </div>
    </div>
  );
}
