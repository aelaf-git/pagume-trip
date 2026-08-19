import { useState, useCallback, useEffect, useRef } from "react"
import { Plus, Pencil, Trash2, Copy, Pause, Play, Compass, Search } from "lucide-react"
import Card from "../../common/Card"
import Button from "../../common/Button"
import Badge from "../../common/Badge"
import ConfirmDialog from "../../common/ConfirmDialog"
import { DESTINATION_LABELS, PACKAGE_STATUS_TONES } from "../../../constants/inventoryOptions"
import { DIFFICULTY_LEVELS } from "../../../constants/inventoryOptions"
import * as inventoryService from "../../../services/inventoryService"
import { placeholderImage } from "../../../constants/mockInventoryData"

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "paused", label: "Paused" },
  { key: "draft", label: "Draft" },
]

const DIFFICULTY_MAP = Object.fromEntries(DIFFICULTY_LEVELS.map((d) => [d.value, d.label]))

function PackageCard({ pkg, onEdit, onDelete, onClone, onToggleStatus }) {
  const coverImage = pkg.images?.[0]?.url || placeholderImage(pkg.name, "#0f9d58")

  return (
    <div className="group bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-40 bg-gray-100">
        <img src={coverImage} alt={pkg.name} className="w-full h-full object-cover" draggable={false} />
        <div className="absolute top-2 left-2 flex gap-1.5">
          <Badge tone={PACKAGE_STATUS_TONES[pkg.status] || "gray"}>
            {pkg.status?.charAt(0).toUpperCase() + pkg.status?.slice(1)}
          </Badge>
          {pkg.difficulty && (
            <Badge tone="gray">{DIFFICULTY_MAP[pkg.difficulty] || pkg.difficulty}</Badge>
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">{pkg.name}</h3>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{pkg.description}</p>

        <div className="flex flex-wrap gap-1.5 mt-3">
          <span className="inline-flex items-center text-xs text-gray-600 bg-gray-100 rounded px-2 py-0.5">
            {DESTINATION_LABELS[pkg.destination] || pkg.destination}
          </span>
          <span className="inline-flex items-center text-xs text-gray-600 bg-gray-100 rounded px-2 py-0.5">
            {pkg.durationDays} day{pkg.durationDays === 1 ? "" : "s"}
          </span>
          <span className="inline-flex items-center text-xs text-gray-600 bg-gray-100 rounded px-2 py-0.5">
            {pkg.minParticipants}-{pkg.maxParticipants} pax
          </span>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <span className="text-sm font-bold text-gray-900">ETB {pkg.price?.toLocaleString()}</span>
          <span className="text-xs text-gray-400">{(pkg.itinerary || []).length} day plan</span>
        </div>

        <div className="flex items-center gap-1 mt-3">
          <button type="button" onClick={() => onToggleStatus(pkg)}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg px-3 py-2 transition-colors ${
              pkg.status === "active"
                ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                : "bg-green-50 text-green-700 hover:bg-green-100"
            }`}
            title={pkg.status === "active" ? "Pause bookings" : "Resume bookings"}>
            {pkg.status === "active" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {pkg.status === "active" ? "Pause" : "Resume"}
          </button>
          <button type="button" onClick={() => onEdit(pkg)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg px-3 py-2 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
          <button type="button" onClick={() => onClone(pkg)}
            className="inline-flex items-center justify-center text-xs font-medium rounded-lg p-2 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
            title="Clone package">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => onDelete(pkg)}
            className="inline-flex items-center justify-center text-xs font-medium rounded-lg p-2 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Delete">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PackageDashboard({ onEditNew, onEditExisting }) {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [deleting, setDeleting] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [notice, setNotice] = useState(null)
  const noticeTimer = useRef(null)

  const showNotice = (msg) => {
    setNotice(msg)
    clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNotice(null), 3000)
  }

  useEffect(() => () => clearTimeout(noticeTimer.current), [])

  const loadPackages = useCallback(async () => {
    const data = await inventoryService.getPackages()
    setPackages(data)
    setLoading(false)
  }, [])

  useEffect(() => { loadPackages() }, [loadPackages])

  const filtered = packages.filter((p) => {
    if (filter !== "all" && p.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return p.name?.toLowerCase().includes(q) || (DESTINATION_LABELS[p.destination] || "").toLowerCase().includes(q)
    }
    return true
  })

  const handleClone = async (pkg) => {
    const cloned = await inventoryService.clonePackage(pkg.id)
    showNotice(`"${cloned.name}" created.`)
    await loadPackages()
  }

  const handleToggleStatus = async (pkg) => {
    await inventoryService.togglePackageStatus(pkg.id)
    showNotice(`"${pkg.name}" ${pkg.status === "active" ? "paused" : "resumed"}.`)
    await loadPackages()
  }

  const handleDelete = async () => {
    setDeletingId(deleting.id)
    try {
      await inventoryService.deletePackage(deleting.id)
      showNotice("Package deleted.")
      setDeleting(null)
      await loadPackages()
    } finally {
      setDeletingId(null)
    }
  }

  const counts = {
    all: packages.length,
    active: packages.filter((p) => p.status === "active").length,
    paused: packages.filter((p) => p.status === "paused").length,
    draft: packages.filter((p) => p.status === "draft").length,
  }

  return (
    <div className="space-y-4">
      {notice && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{notice}</div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {STATUS_FILTERS.map((f) => (
            <button key={f.key} type="button" onClick={() => setFilter(f.key)}
              className={`whitespace-nowrap px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                filter === f.key ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {f.label} ({counts[f.key] || 0})
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input type="text" placeholder="Search packages..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none w-48" />
          </div>
          <Button onClick={onEditNew} size="sm">
            <Plus className="h-4 w-4" /> New Package
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <div className="py-12 text-center text-sm text-gray-400">Loading packages...</div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center py-12 text-center">
            <Compass className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">
              {packages.length === 0 ? "No packages yet. Create your first tour package." : "No packages match your filters."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} onEdit={onEditExisting} onDelete={setDeleting} onClone={handleClone} onToggleStatus={handleToggleStatus} />
          ))}
        </div>
      )}

      <ConfirmDialog open={Boolean(deleting)} onClose={() => setDeleting(null)} title="Delete package"
        message={`Delete "${deleting?.name}"? This cannot be undone.`} onConfirm={handleDelete} confirming={Boolean(deletingId)} />
    </div>
  )
}
