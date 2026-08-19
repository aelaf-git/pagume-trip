import { CalendarCheck, Wallet, Star, Package, BedDouble, Map, Car, UserCheck, ExternalLink } from "lucide-react"
import { useNavigate } from "react-router-dom"
import Card from "../../components/common/Card"
import PageHeader from "../../components/common/PageHeader"
import Badge from "../../components/common/Badge"
import OnboardingStatusCard from "../../components/provider/OnboardingStatusCard"
import ProviderAnalytics from "../../components/analytics/ProviderAnalytics"
import { useAuth } from "../../contexts/AuthContext"
import { useProviderProfile } from "../../contexts/ProviderProfileContext"
import { useOnboardingStatus } from "../../hooks/useOnboardingStatus"

const DASHBOARD_CONFIG = {
  hotel: {
    greeting: "Here's your property overview.",
    stats: [
      { label: "Rooms Available", value: "12", icon: BedDouble },
      { label: "Occupancy Rate", value: "74%", icon: CalendarCheck },
      { label: "This Month's Revenue", value: "ETB 342,500", icon: Wallet },
      { label: "Average Rating", value: "4.7", icon: Star },
    ],
    quickActions: [
      { label: "Manage Rooms", path: "/provider/listings", description: "Add, edit, or remove rooms from your inventory." },
      { label: "View Bookings", path: "/provider/bookings", description: "Check upcoming reservations and availability." },
      { label: "Edit Profile", path: "/provider/profile", description: "Update amenities, policies, and media." },
    ],
  },
  agency: {
    greeting: "Here's your agency performance.",
    stats: [
      { label: "Active Packages", value: "6", icon: Package },
      { label: "Pending Bookings", value: "4", icon: CalendarCheck },
      { label: "This Month's Revenue", value: "ETB 186,200", icon: Wallet },
      { label: "Average Rating", value: "4.8", icon: Star },
    ],
    quickActions: [
      { label: "Edit Packages", path: "/provider/listings", description: "Build and manage your tour packages." },
      { label: "View Bookings", path: "/provider/bookings", description: "Review bookings and manage availability." },
      { label: "Edit Profile", path: "/provider/profile", description: "Update agency details and languages." },
    ],
  },
  transport: {
    greeting: "Here's your fleet status.",
    stats: [
      { label: "Fleet Size", value: "8", icon: Car },
      { label: "Active Rentals", value: "5", icon: CalendarCheck },
      { label: "This Month's Revenue", value: "ETB 214,800", icon: Wallet },
      { label: "Average Rating", value: "4.6", icon: Star },
    ],
    quickActions: [
      { label: "Manage Fleet", path: "/provider/listings", description: "Update vehicles, pricing, and rental terms." },
      { label: "View Bookings", path: "/provider/bookings", description: "Check active and upcoming rentals." },
      { label: "Edit Profile", path: "/provider/profile", description: "Update company info and branches." },
    ],
  },
  driver: {
    greeting: "Here's your guide dashboard.",
    stats: [
      { label: "Upcoming Assignments", value: "3", icon: UserCheck },
      { label: "Completed Tours", value: "28", icon: Package },
      { label: "This Month's Income", value: "ETB 67,500", icon: Wallet },
      { label: "Average Rating", value: "4.9", icon: Star },
    ],
    quickActions: [
      { label: "My Schedule", path: "/provider/bookings", description: "View your calendar and manage availability." },
      { label: "My Assignments", path: "/provider/bookings", description: "Track tour assignments and preparation." },
      { label: "Edit Profile", path: "/provider/profile", description: "Update rates, languages, and coverage." },
    ],
  },
}

const FALLBACK_CONFIG = {
  greeting: "Here's what's happening with your business.",
  stats: [
    { label: "Active Listings", value: "—", icon: Package },
    { label: "Upcoming Bookings", value: "—", icon: CalendarCheck },
    { label: "This Month's Earnings", value: "—", icon: Wallet },
    { label: "Average Rating", value: "—", icon: Star },
  ],
  quickActions: [],
}

const PROVIDER_TYPE_LABELS = {
  hotel: "Hotel",
  agency: "Travel Agency",
  transport: "Car Rental",
  driver: "Tour Guide",
}

export default function ProviderDashboard() {
  const { user } = useAuth()
  const { profile, providerType } = useProviderProfile()
  const { status, loading: onboardingLoading } = useOnboardingStatus()
  const navigate = useNavigate()

  const config = DASHBOARD_CONFIG[providerType] || FALLBACK_CONFIG
  const typeLabel = PROVIDER_TYPE_LABELS[providerType] || "Provider"

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{config.greeting}</p>
        </div>
        <Badge tone="brand">{typeLabel}</Badge>
      </div>

      {!onboardingLoading && status && (
        <OnboardingStatusCard
          status={status.status}
          reviewNotes={status.reviewNotes}
          submittedAt={status.submittedAt}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {config.stats.map(({ label, value, icon: Icon }) => (
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

      {config.quickActions.length > 0 && (
        <Card title="Quick Actions">
          <div className="grid gap-3 sm:grid-cols-3">
            {config.quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => navigate(action.path)}
                className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 text-left hover:border-brand-300 hover:bg-brand-50/30 transition-colors group"
              >
                <div className="mt-0.5">
                  <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-brand-500 transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 group-hover:text-brand-700 transition-colors">
                    {action.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{action.description}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}

      <ProviderAnalytics />
    </div>
  )
}
