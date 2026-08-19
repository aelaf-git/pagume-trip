import { useCallback, useEffect, useRef, useState } from "react"
import { CheckCircle2, Circle, Plus, ChevronDown, ChevronUp, Filter } from "lucide-react"
import Card from "../../common/Card"
import Badge from "../../common/Badge"
import Button from "../../common/Button"
import Input from "../../common/Input"
import { PREPARATION_STEP_OPTIONS } from "../../../constants/inventoryOptions"
import * as bookingService from "../../../services/bookingService"

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "upcoming", label: "Upcoming" },
  { key: "in_progress", label: "In Progress" },
  { key: "completed", label: "Completed" },
]

const STATUS_CONFIG = {
  upcoming: { label: "Upcoming", tone: "blue" },
  in_progress: { label: "In Progress", tone: "amber" },
  completed: { label: "Completed", tone: "green" },
}

const TONE_MAP = { blue: "brand", amber: "amber", green: "green" }

function AssignmentCard({ assignment, onToggleStep, onAddStep }) {
  const [expanded, setExpanded] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newStep, setNewStep] = useState("")

  const done = assignment.preparation.filter((p) => p.done).length
  const total = assignment.preparation.length
  const progress = total > 0 ? Math.round((done / total) * 100) : 0

  const handleAdd = () => {
    if (newStep.trim()) {
      onAddStep(assignment.id, newStep.trim())
      setNewStep("")
      setAdding(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm">{assignment.clientName}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{assignment.tourType}</p>
          </div>
          <Badge tone={TONE_MAP[STATUS_CONFIG[assignment.status]?.tone] || "gray"}>
            {STATUS_CONFIG[assignment.status]?.label || assignment.status}
          </Badge>
        </div>

        <p className="text-xs text-gray-500 mt-2 line-clamp-1">{assignment.route}</p>

        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <span>{assignment.startDate} {assignment.startDate !== assignment.endDate ? `\u2014 ${assignment.endDate}` : ""}</span>
          <span className="font-semibold text-gray-800">ETB {assignment.income?.toLocaleString()}</span>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">Preparation ({done}/{total})</span>
            <span className={`font-medium ${progress === 100 ? "text-green-600" : "text-gray-500"}`}>{progress}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full transition-all ${progress === 100 ? "bg-green-500" : "bg-brand-500"}`} style={{ width: `${progress}%` }} />
          </div>
        </div>

        <button type="button" onClick={() => setExpanded(!expanded)}
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700">
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {expanded ? "Hide checklist" : "Show checklist"}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-2 bg-gray-50">
          {assignment.preparation.map((prep, i) => (
            <label key={i} className="flex items-center gap-2.5 cursor-pointer group">
              <button type="button" onClick={() => onToggleStep(assignment.id, i)}
                className="shrink-0 focus:outline-none">
                {prep.done ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Circle className="h-4 w-4 text-gray-300 group-hover:text-gray-400" />
                )}
              </button>
              <span className={`text-sm ${prep.done ? "text-gray-400 line-through" : "text-gray-700"}`}>
                {prep.step}
              </span>
            </label>
          ))}

          {adding ? (
            <div className="flex items-center gap-2 mt-2">
              <Input value={newStep} placeholder="Preparation step..." onChange={(e) => setNewStep(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleAdd() }} />
              <Button size="sm" onClick={handleAdd}>Add</Button>
              <Button size="sm" variant="outline" onClick={() => { setAdding(false); setNewStep("") }}>Cancel</Button>
            </div>
          ) : (
            <button type="button" onClick={() => setAdding(true)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 mt-1">
              <Plus className="h-3.5 w-3.5" /> Add step
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function DriverAssignments() {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [notice, setNotice] = useState(null)
  const noticeTimer = useRef(null)

  const showNotice = (msg) => {
    setNotice(msg)
    clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNotice(null), 3000)
  }

  useEffect(() => () => clearTimeout(noticeTimer.current), [])

  const loadAssignments = useCallback(async () => {
    const data = await bookingService.getDriverAssignments()
    setAssignments(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadAssignments() }, [loadAssignments])

  const filtered = assignments.filter((a) => {
    if (filter !== "all" && a.status !== filter) return false
    return true
  })

  const counts = {
    all: assignments.length,
    upcoming: assignments.filter((a) => a.status === "upcoming").length,
    in_progress: assignments.filter((a) => a.status === "in_progress").length,
    completed: assignments.filter((a) => a.status === "completed").length,
  }

  const handleToggleStep = async (assignmentId, stepIndex) => {
    await bookingService.togglePrepStep(assignmentId, stepIndex)
    setAssignments((prev) => prev.map((a) => {
      if (a.id !== assignmentId) return a
      const prep = [...a.preparation]
      prep[stepIndex] = { ...prep[stepIndex], done: !prep[stepIndex].done }
      return { ...a, preparation: prep }
    }))
  }

  const handleAddStep = async (assignmentId, stepText) => {
    await bookingService.addPrepStep(assignmentId, stepText)
    setAssignments((prev) => prev.map((a) => {
      if (a.id !== assignmentId) return a
      return { ...a, preparation: [...a.preparation, { step: stepText, done: false }] }
    }))
    showNotice("Step added.")
  }

  return (
    <div className="space-y-4">
      {notice && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{notice}</div>
      )}

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button key={f.key} type="button" onClick={() => setFilter(f.key)}
            className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              filter === f.key ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}>
            {f.label} ({counts[f.key] || 0})
          </button>
        ))}
      </div>

      {loading ? (
        <Card>
          <div className="py-12 text-center text-sm text-gray-400">Loading assignments...</div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center py-12 text-center">
            <Filter className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">
              {assignments.length === 0 ? "No tour assignments yet." : "No assignments match your filter."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} onToggleStep={handleToggleStep} onAddStep={handleAddStep} />
          ))}
        </div>
      )}
    </div>
  )
}
