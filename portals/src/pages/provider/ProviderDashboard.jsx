import { useEffect, useState } from "react";
import { CalendarCheck, Wallet, Star, Package } from "lucide-react";
import Card from "../../components/common/Card";
import PageHeader from "../../components/common/PageHeader";
import OnboardingStatusCard from "../../components/provider/OnboardingStatusCard";
import ProviderAnalytics from "../../components/analytics/ProviderAnalytics";
import { useAuth } from "../../contexts/AuthContext";
import { useOnboardingStatus } from "../../hooks/useOnboardingStatus";
import { api } from "../../services/api";

export default function ProviderDashboard() {
  const { user } = useAuth();
  const { status, loading } = useOnboardingStatus();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api
      .get("/providers/dashboard/stats")
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  const cards = [
    {
      label: "Total bookings",
      value: stats ? String(stats.bookings_total) : "…",
      icon: Package,
    },
    {
      label: "Pending bookings",
      value: stats ? String(stats.bookings_pending) : "…",
      icon: CalendarCheck,
    },
    {
      label: "Earnings (ETB)",
      value: stats ? Number(stats.revenue || 0).toLocaleString() : "…",
      icon: Wallet,
    },
    {
      label: "Average rating",
      value: stats ? String(stats.average_rating || "—") : "…",
      icon: Star,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.name}`}
        description="Here's what's happening with your business."
      />

      {!loading && status && (
        <OnboardingStatusCard
          status={status.status}
          reviewNotes={status.reviewNotes}
          submittedAt={status.submittedAt}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                <Icon className="h-5 w-5 text-brand-600" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <ProviderAnalytics />
    </div>
  );
}
