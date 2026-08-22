import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Building2,
  CarFront,
  Compass,
  MapPin,
  Users,
  BedDouble,
} from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import { getDashboardStats } from "../../services/agentMonitorService";
import { getActivities } from "../../services/adminService";
import { queryKeys, STALE_ADMIN_MS } from "../../lib/queryKeys";

const TYPE_TONE = {
  provider: "amber",
  moderation: "red",
  agent_run: "gray",
  review: "brand",
};

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}

export default function AdminDashboard() {
  const statsQuery = useQuery({
    queryKey: queryKeys.adminDashboardStats,
    queryFn: getDashboardStats,
    staleTime: STALE_ADMIN_MS,
  });

  const recentQuery = useQuery({
    queryKey: [...queryKeys.adminActivities, "recent", 10],
    queryFn: () => getActivities({ limit: 10, offset: 0 }),
    staleTime: STALE_ADMIN_MS,
  });

  const stats = statsQuery.data;
  const recent = recentQuery.data ?? [];

  const cards = stats
    ? [
        {
          label: "Destinations",
          value: stats.destinations,
          icon: MapPin,
          color: "text-blue-600",
          bg: "bg-blue-50",
          to: "/admin/destinations",
        },
        {
          label: "Pending providers",
          value: stats.providers_pending,
          icon: Building2,
          color: "text-amber-600",
          bg: "bg-amber-50",
          to: "/admin/providers",
        },
        {
          label: "Verified providers",
          value: stats.providers_verified,
          icon: Users,
          color: "text-brand-600",
          bg: "bg-brand-50",
          to: "/admin/providers",
        },
        {
          label: "Hotels & resorts",
          value: stats.hotels,
          icon: BedDouble,
          color: "text-indigo-600",
          bg: "bg-indigo-50",
        },
        {
          label: "Tour packages",
          value: stats.tours,
          icon: Compass,
          color: "text-teal-600",
          bg: "bg-teal-50",
        },
        {
          label: "Vehicles",
          value: stats.vehicles,
          icon: CarFront,
          color: "text-orange-600",
          bg: "bg-orange-50",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin dashboard"
        description="Destinations and registered hotels, agencies, and car rentals"
      />

      {statsQuery.isError && (
        <p className="text-sm text-red-500">
          {statsQuery.error?.message || "Could not load dashboard stats."}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statsQuery.isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <p className="text-sm text-gray-400">Loading…</p>
            </Card>
          ))}
        {cards.map((stat) => {
          const inner = (
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}
              >
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          );
          return (
            <Card key={stat.label}>
              {stat.to ? (
                <Link to={stat.to} className="block hover:opacity-90">
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </Card>
          );
        })}
      </div>

      <Card
        title="Recent provider activity"
        action={
          <Link
            to="/admin/activities"
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            View all
          </Link>
        }
      >
        {recentQuery.isLoading ? (
          <p className="py-6 text-center text-sm text-gray-400">Loading activity…</p>
        ) : recentQuery.isError ? (
          <p className="py-6 text-center text-sm text-red-500">
            {recentQuery.error?.message || "Could not load activity."}
          </p>
        ) : recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">No activity recorded yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recent.map((event) => (
              <li
                key={event.id}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={TYPE_TONE[event.type] || "gray"}>{event.type}</Badge>
                    {event.status && <Badge tone="gray">{event.status}</Badge>}
                  </div>
                  <p className="mt-1 text-sm font-medium text-gray-900">{event.title}</p>
                  <p className="text-sm text-gray-600">{event.summary}</p>
                </div>
                <p className="shrink-0 text-xs text-gray-400">{formatWhen(event.occurredAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/admin/destinations"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
        >
          Manage destinations
        </Link>
        <Link
          to="/admin/providers"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
        >
          Review providers
        </Link>
      </div>
    </div>
  );
}
