import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import Select from "../../components/common/Select";
import { getActivities } from "../../services/adminService";
import { queryKeys, STALE_ADMIN_MS } from "../../lib/queryKeys";

const TYPE_OPTIONS = [
  { value: "provider", label: "Providers" },
  { value: "moderation", label: "Moderation" },
  { value: "agent_run", label: "Agent runs" },
  { value: "review", label: "Reviews" },
];

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

function ActivityRow({ event }) {
  const [open, setOpen] = useState(false);
  const metaEntries = Object.entries(event.meta || {}).filter(
    ([, v]) => v !== null && v !== undefined && v !== ""
  );

  return (
    <li className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50"
      >
        <span className="mt-0.5 text-gray-400">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={TYPE_TONE[event.type] || "gray"}>{event.type}</Badge>
            {event.status && <Badge tone="gray">{event.status}</Badge>}
            <span className="text-xs text-gray-400">{formatWhen(event.occurredAt)}</span>
          </div>
          <p className="mt-1 text-sm font-medium text-gray-900">{event.title}</p>
          <p className="text-sm text-gray-600">{event.summary}</p>
          {(event.actorLabel || event.entityLabel) && (
            <p className="mt-0.5 text-xs text-gray-400">
              {[event.actorLabel, event.entityLabel].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
      </button>
      {open && metaEntries.length > 0 && (
        <dl className="grid gap-1 border-t border-gray-50 bg-gray-50/80 px-4 py-3 text-xs sm:grid-cols-2">
          {metaEntries.map(([key, value]) => (
            <div key={key} className="flex gap-2">
              <dt className="shrink-0 font-medium text-gray-500">{key}</dt>
              <dd className="min-w-0 break-all text-gray-800">
                {typeof value === "object" ? JSON.stringify(value) : String(value)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </li>
  );
}

export default function AdminActivities() {
  const [typeFilter, setTypeFilter] = useState("");

  const activitiesQuery = useQuery({
    queryKey: [...queryKeys.adminActivities, typeFilter || "all"],
    queryFn: () =>
      getActivities({
        type: typeFilter || undefined,
        limit: 100,
        offset: 0,
      }),
    staleTime: STALE_ADMIN_MS,
  });

  const events = activitiesQuery.data ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Platform activity"
        description="Provider registrations, moderation, reviews, and agent runs."
      />

      <div className="max-w-xs">
        <Select
          id="activity-type"
          label="Filter by type"
          options={TYPE_OPTIONS}
          placeholder="All types"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        />
      </div>

      <Card>
        {activitiesQuery.isLoading ? (
          <p className="px-4 py-10 text-center text-sm text-gray-400">Loading activity…</p>
        ) : activitiesQuery.isError ? (
          <p className="px-4 py-10 text-center text-sm text-red-500">
            {activitiesQuery.error?.message || "Could not load activity."}
          </p>
        ) : events.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-gray-400">
            No activity recorded yet.
          </p>
        ) : (
          <ul>
            {events.map((event) => (
              <ActivityRow key={event.id} event={event} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
