import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";

export default function Login() {
  const { login, isAuthenticating, authError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = await login(form.email, form.password);
      const redirectTo = location.state?.from?.pathname ?? `/${user.role}/dashboard`;
      navigate(redirectTo, { replace: true });
    } catch {
      // authError is already surfaced via context
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <img src="/pagume_logo.png" alt="Pagume Trip" className="h-8 w-8 object-contain" />
          <span className="text-xl font-bold text-gray-900">Pagume Trip</span>
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

            {authError && <p className="text-sm text-red-500">{authError}</p>}

            <Button type="submit" className="w-full" loading={isAuthenticating}>
              Sign in
            </Button>

            <p className="text-xs text-gray-400 text-center">
              Demo: provider@pagume.et / admin@pagume.et — password123
            </p>
          </form>
        </Card>

        <p className="text-sm text-center text-gray-500 mt-4">
          New tourism provider?{" "}
          <Link to="/register" className="text-brand-600 font-medium hover:underline">
            Register your business
          </Link>
        </p>
      </div>
    </div>
  );
}
