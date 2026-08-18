import { useState, useEffect, useCallback } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import Card from "../common/Card"
import Badge from "../common/Badge"
import { AGENT_TYPES, RUN_STATUSES } from "../../constants/mockAgentData"
import { getWorkflows } from "../../services/agentMonitorService"

function TreeNode({ node, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth === 0)
  const agentConf = AGENT_TYPES[node.agent]
  const statusConf = RUN_STATUSES[node.status]
  const hasChildren = node.children && node.children.length > 0

  return (
    <div className={depth > 0 ? "ml-6" : ""}>
      <div className="flex items-center gap-2 py-2">
        {depth > 0 && (
          <div className="w-4 h-px bg-gray-300 shrink-0" />
        )}

        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="shrink-0 text-gray-400 hover:text-gray-600">
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <div className="w-4 shrink-0" />
        )}

        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: agentConf?.color || "#9ca3af" }}
        />

        <span className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
          style={{ backgroundColor: (agentConf?.color || "#9ca3af") + "15", color: agentConf?.color || "#9ca3af" }}>
          {agentConf?.label || node.agent}
        </span>

        <span className="text-sm text-gray-800 truncate flex-1">{node.task}</span>

        <Badge tone={statusConf?.tone}>{statusConf?.label}</Badge>

        <span className="text-xs text-gray-500 shrink-0 w-14 text-right">{node.duration}</span>
      </div>

      {expanded && hasChildren && (
        <div className="border-l-2 border-gray-200 ml-[7px]">
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function WorkflowCard({ workflow }) {
  const [expanded, setExpanded] = useState(true)
  const statusConf = RUN_STATUSES[workflow.status]
  const rootNode = workflow.nodes?.[0]
  const childCount = rootNode?.children?.length || 0

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors rounded-t-xl"
      >
        <button className="text-gray-400">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">{workflow.label}</span>
            <Badge tone={statusConf?.tone}>{statusConf?.label}</Badge>
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
            <span className="font-mono">{workflow.runId}</span>
            <span>{childCount} sub-agent{childCount !== 1 ? "s" : ""}</span>
            <span>{workflow.totalDuration}</span>
            <span>{new Date(workflow.startedAt).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
          {workflow.nodes.map((node) => (
            <TreeNode key={node.id} node={node} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function WorkflowTreeView() {
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)

  const loadWorkflows = useCallback(async () => {
    const data = await getWorkflows()
    setWorkflows(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadWorkflows()
  }, [loadWorkflows])

  if (loading) {
    return (
      <Card>
        <div className="py-12 text-center text-gray-500">Loading workflows...</div>
      </Card>
    )
  }

  if (workflows.length === 0) {
    return (
      <Card>
        <div className="py-12 text-center text-gray-400">
          No workflow data available.
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {workflows.map((wf) => (
        <WorkflowCard key={wf.id} workflow={wf} />
      ))}
    </div>
  )
}
