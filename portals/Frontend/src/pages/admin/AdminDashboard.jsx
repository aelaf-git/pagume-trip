import { useState } from "react"
import { Zap, Clock, CheckCircle2, AlertTriangle } from "lucide-react"
import PageHeader from "../../components/common/PageHeader"
import Card from "../../components/common/Card"
import AgentRunLog from "../../components/admin/AgentRunLog"
import WorkflowTreeView from "../../components/admin/WorkflowTreeView"

const TABS = [
  { key: "runs", label: "Agent Runs" },
  { key: "tree", label: "Workflow Tree" },
]

const STATS = [
  { label: "Total Runs", value: "10", icon: Zap, color: "text-brand-600", bg: "bg-brand-50" },
  { label: "Active Agents", value: "6", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
  { label: "Avg Duration", value: "2.3s", icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Success Rate", value: "80%", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
]

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("runs")

  return (
    <div>
      <PageHeader title="AI Agent Observability" description="Monitor and diagnose Pagume's multi-agent system" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {STATS.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "runs" && <AgentRunLog />}
      {activeTab === "tree" && <WorkflowTreeView />}
    </div>
  )
}
