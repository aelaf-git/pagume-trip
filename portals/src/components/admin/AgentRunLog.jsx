import { useState, useEffect, useCallback } from "react"
import { ChevronDown, ChevronRight, Clock, Zap, AlertTriangle } from "lucide-react"
import Card from "../common/Card"
import Badge from "../common/Badge"
import { AGENT_TYPES, RUN_STATUSES } from "../../constants/mockAgentData"
import { getAgentRuns } from "../../services/agentMonitorService"

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "COMPLETED", label: "Completed" },
  { key: "RUNNING", label: "Running" },
  { key: "FAILED", label: "Failed" },
  { key: "AWAITING_APPROVAL", label: "Awaiting Approval" },
]

function RunRow({ run }) {
  const [expanded, setExpanded] = useState(false)
  const agentConf = AGENT_TYPES[run.agent]
  const statusConf = RUN_STATUSES[run.status]
  const tokenCount =
    typeof run.tokenUsage === "number"
      ? run.tokenUsage
      : Number(run.tokenUsage?.total ?? run.tokenUsage?.prompt ?? 0)
  const tools = Array.isArray(run.toolsCalled) ? run.toolsCalled : []
  const toolResults = Array.isArray(run.toolResults) ? run.toolResults : []
  const decisionsText = Array.isArray(run.decisions)
    ? run.decisions.join(" ")
    : run.decisions || "—"

  return (
    <div className="border-b border-gray-50 last:border-0">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 py-3.5 px-1 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <button className="shrink-0 text-gray-400">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <span className="text-xs font-mono text-gray-400 w-20 shrink-0">{run.id}</span>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
          style={{ backgroundColor: (agentConf?.color || "#666") + "15", color: agentConf?.color || "#666" }}
        >
          {agentConf?.label || run.agent}
        </span>
        <span className="text-sm text-gray-800 truncate flex-1">{run.task}</span>
        <Badge tone={statusConf?.tone || "gray"}>{statusConf?.label || run.status}</Badge>
        <span className="text-xs text-gray-500 w-16 text-right shrink-0">{run.duration}</span>
        <span className="text-xs text-gray-400 w-20 text-right shrink-0">{tokenCount.toLocaleString()} tok</span>
      </div>

      {expanded && (
        <div className="ml-7 mr-4 mb-4 p-4 bg-gray-50 rounded-lg space-y-4 text-sm animate-in">
          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Input Parameters</h5>
            <pre className="text-xs bg-white rounded-lg p-3 border border-gray-200 overflow-x-auto text-gray-700">
              {JSON.stringify(run.inputParams, null, 2)}
            </pre>
          </div>

          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Tools Called</h5>
            <div className="flex flex-wrap gap-2">
              {tools.map((tool, i) => (
                <span key={`${tool}-${i}`} className="text-xs bg-brand-50 text-brand-700 border border-brand-200 rounded-full px-2.5 py-0.5 font-mono">
                  {typeof tool === "string" ? tool : JSON.stringify(tool)}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Tool Results</h5>
            <div className="space-y-1.5">
              {toolResults.map((tr, i) => (
                <div key={i} className="flex gap-2 text-xs">
                  <span className="font-mono text-brand-600 shrink-0">{tr.tool || "tool"}:</span>
                  <span className="text-gray-600">{typeof tr.result === "string" ? tr.result : JSON.stringify(tr.result)}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h5 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Decisions</h5>
            <p className="text-xs text-gray-600">{decisionsText}</p>
          </div>

          <div className="flex gap-6 text-xs text-gray-500">
            <span><Clock className="inline h-3.5 w-3.5 mr-1" />{run.duration}</span>
            <span><Zap className="inline h-3.5 w-3.5 mr-1" />{tokenCount.toLocaleString()} tokens</span>
            <span>Approval: {run.userApproval || "—"}</span>
            <span>Outcome: {run.outcome || "—"}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AgentRunLog() {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")

  const loadRuns = useCallback(async () => {
    try {
      const data = await getAgentRuns()
      setRuns(Array.isArray(data) ? data : [])
    } catch {
      setRuns([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRuns()
  }, [loadRuns])

  const filtered = runs.filter((r) => {
    const matchesFilter = filter === "all" || r.status === filter
    const matchesSearch = !search || r.task.toLowerCase().includes(search.toLowerCase()) ||
      r.agent.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const counts = {
    all: runs.length,
    COMPLETED: runs.filter((r) => r.status === "COMPLETED").length,
    RUNNING: runs.filter((r) => r.status === "RUNNING").length,
    FAILED: runs.filter((r) => r.status === "FAILED").length,
    AWAITING_APPROVAL: runs.filter((r) => r.status === "AWAITING_APPROVAL").length,
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search runs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none w-64"
        />
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((sf) => (
            <button
              key={sf.key}
              onClick={() => setFilter(sf.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                filter === sf.key
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              {sf.label}
              <span className={`ml-1 ${filter === sf.key ? "text-brand-100" : "text-gray-400"}`}>
                {counts[sf.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Card>
          <div className="py-12 text-center text-gray-500">Loading agent runs...</div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="py-12 text-center text-gray-400">
            <AlertTriangle className="h-10 w-10 mx-auto mb-2 opacity-40" />
            No agent runs found.
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-gray-400 w-8"></th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Run ID</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Agent</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Task</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-gray-400 text-right">Duration</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-gray-400 text-right">Tokens</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((run) => (
                  <RunRow key={run.id} run={run} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
