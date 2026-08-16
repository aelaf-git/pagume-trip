import { CalendarCheck, Wallet, Star, Package } from "lucide-react";
import Card from "../../components/common/Card";
import PageHeader from "../../components/common/PageHeader";
import OnboardingStatusCard from "../../components/provider/OnboardingStatusCard";
import { useAuth } from "../../contexts/AuthContext";
import { useOnboardingStatus } from "../../hooks/useOnboardingStatus";

const STATS = [
  { label: "Active Listings", value: "12", icon: Package },
  { label: "Upcoming Bookings", value: "8", icon: CalendarCheck },
  { label: "This Month's Earnings", value: "ETB 84,200", icon: Wallet },
  { label: "Average Rating", value: "4.7", icon: Star },
];

export default function ProviderDashboard() {
  const { user } = useAuth();
  const { status, loading } = useOnboardingStatus();

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome back, ${user?.name}`} description="Here's what's happening with your business." />

      {!loading && status && (
        <OnboardingStatusCard
          status={status.status}
          reviewNotes={status.reviewNotes}
          submittedAt={status.submittedAt}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-brand-50 flex items-center justify-center">
                <Icon className="h-5 w-5 text-brand-600" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
