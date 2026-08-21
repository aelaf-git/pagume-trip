import { useEffect, useState } from "react";
import {
  Building2,
  CalendarCheck,
  MapPin,
  Users,
  Wallet,
} from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import AgentRunLog from "../../components/admin/AgentRunLog";
import { getDashboardStats } from "../../services/agentMonitorService";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((e) => setError(e.message));
  }, []);

  const cards = stats
    ? [
        {
          label: "Users",
          value: stats.users_total,
          icon: Users,
          color: "text-brand-600",
          bg: "bg-brand-50",
        },
        {
          label: "Pending providers",
          value: stats.providers_pending,
          icon: Building2,
          color: "text-amber-600",
          bg: "bg-amber-50",
        },
        {
          label: "Destinations",
          value: stats.destinations,
          icon: MapPin,
          color: "text-blue-600",
          bg: "bg-blue-50",
        },
        {
          label: "Bookings",
          value: stats.bookings_total,
          icon: CalendarCheck,
          color: "text-green-600",
          bg: "bg-green-50",
        },
        {
          label: "Payments (ETB)",
          value: Number(stats.payments_total || 0).toLocaleString(),
          icon: Wallet,
          color: "text-gray-700",
          bg: "bg-gray-100",
        },
      ]
    : [];

  return (
    <div>
      <PageHeader
        title="Admin dashboard"
        description="Platform overview from the portal database"
      />

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}
              >
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-lg font-semibold text-gray-900">
                  {stats ? stat.value : "…"}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card title="Agent run log">
        <AgentRunLog />
      </Card>
    </div>
  );
}
