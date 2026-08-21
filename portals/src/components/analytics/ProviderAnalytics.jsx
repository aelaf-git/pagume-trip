import { useCallback, useEffect, useState } from "react";
import { Eye, Search, Sparkles, Wallet, CalendarCheck, TrendingUp, TrendingDown } from "lucide-react";
import Card from "../common/Card";
import BarChart from "./BarChart";
import LineChart from "./LineChart";
import * as bookingService from "../../services/bookingService";

const METRIC_ICONS = {
  profileViews: Eye,
  searchAppearances: Search,
  aiRecommendations: Sparkles,
  revenue: Wallet,
  bookingRequests: CalendarCheck,
  conversionRate: TrendingUp,
};

function MetricCard({ metric }) {
  const Icon = METRIC_ICONS[metric.key] ?? TrendingUp;
  const isHighlight = metric.highlight;

  const displayValue =
    metric.prefix
      ? `${metric.prefix}${Number(metric.value).toLocaleString()}`
      : metric.suffix
        ? `${metric.value}${metric.suffix}`
        : Number(metric.value).toLocaleString();

  if (isHighlight) {
    return (
      <div className="sm:col-span-2 lg:col-span-2 rounded-xl bg-brand-50 border border-brand-200 p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-brand-700 mb-1">Featured Metric</p>
            <p className="text-xs text-brand-600/70 mb-3">{metric.label}</p>
            <p className="text-3xl font-bold text-brand-800">{displayValue}</p>
            <div className="mt-2 flex items-center gap-1">
              {metric.trendUp ? (
                <TrendingUp className="h-3.5 w-3.5 text-green-600" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              )}
              <span className={`text-xs font-medium ${metric.trendUp ? "text-green-600" : "text-red-500"}`}>
                {metric.trend}
              </span>
              <span className="text-xs text-gray-400 ml-1">vs last month</span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-brand-600 flex items-center justify-center shadow-sm">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{metric.label}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{displayValue}</p>
          <div className="mt-1.5 flex items-center gap-1">
            {metric.trendUp ? (
              <TrendingUp className="h-3 w-3 text-green-600" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={`text-xs font-medium ${metric.trendUp ? "text-green-600" : "text-red-500"}`}>
              {metric.trend}
            </span>
          </div>
        </div>
        <div className="h-10 w-10 rounded-lg bg-brand-50 flex items-center justify-center">
          <Icon className="h-5 w-5 text-brand-600" />
        </div>
      </div>
    </Card>
  );
}

export default function ProviderAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    const data = await bookingService.getAnalytics();
    setAnalytics(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading || !analytics) {
    return (
      <div className="space-y-4">
        <div className="h-24 rounded-xl bg-gray-100 animate-pulse" />
        <div className="h-24 rounded-xl bg-gray-100 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Analytics Overview</h3>
        <p className="text-sm text-gray-500">Performance insights for your provider profile.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {analytics.metrics.map((metric) => (
          <MetricCard key={metric.key} metric={metric} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Monthly Revenue">
          <BarChart data={analytics.monthlyRevenue} barColor="#0c7f47" />
        </Card>
        <Card title="Monthly Bookings">
          <LineChart data={analytics.monthlyBookings} lineColor="#0f9d58" />
        </Card>
      </div>
    </div>
  );
}
