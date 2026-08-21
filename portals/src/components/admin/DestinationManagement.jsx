import { useState, useEffect, useCallback, useRef } from "react"
import { Search, Plus, Upload, Pencil, Trash2, MapPin } from "lucide-react"
import Card from "../common/Card"
import Select from "../common/Select"
import Button from "../common/Button"
import Badge from "../common/Badge"
import ConfirmDialog from "../common/ConfirmDialog"
import { DESTINATION_CATEGORIES, DESTINATION_REGIONS, CATEGORY_TONES } from "../../constants/destinationOptions"
import { getDestinations, createDestination, updateDestination, deleteDestination, importDestinations } from "../../services/destinationService"
import DestinationFormModal from "./DestinationFormModal"
import DestinationDetailModal from "./DestinationDetailModal"
import BulkImportModal from "./BulkImportModal"

const CATEGORY_FILTER_OPTIONS = [
  { value: "all", label: "All Categories" },
  ...DESTINATION_CATEGORIES,
]

export default function DestinationManagement() {
  const [destinations, setDestinations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [formOpen, setFormOpen] = useState(false)
  const [editingDest, setEditingDest] = useState(null)
  const [detailDest, setDetailDest] = useState(null)
  const [importOpen, setImportOpen] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [notice, setNotice] = useState("")
  const noticeTimer = useRef(null)

  const showNotice = useCallback((msg) => {
    setNotice(msg)
    clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNotice(""), 3000)
  }, [])

  const loadData = useCallback(async () => {
    const data = await getDestinations()
    setDestinations(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
    return () => clearTimeout(noticeTimer.current)
  }, [loadData])

  const filtered = destinations.filter((d) => {
    const matchesSearch = !search || [d.name, d.region, d.zone, d.woreda, d.category]
      .some((f) => f?.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory = categoryFilter === "all" || d.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleSave = async (id, data) => {
    if (id) {
      await updateDestination(id, data)
      showNotice("Destination updated")
    } else {
      await createDestination(data)
      showNotice("Destination created")
    }
    setFormOpen(false)
    setEditingDest(null)
    loadData()
  }

  const handleDelete = async () => {
    await deleteDestination(deletingId)
    showNotice("Destination deleted")
    setDeletingId(null)
    loadData()
  }

  const handleImport = async (items) => {
    await importDestinations(items)
    loadData()
  }

  const openCreate = () => {
    setEditingDest(null)
    setFormOpen(true)
  }

  const openEdit = (dest) => {
    setDetailDest(null)
    setEditingDest(dest)
    setFormOpen(true)
  }

  const openDetail = (dest) => {
    setDetailDest(dest)
  }

  return (
    <div className="space-y-4">
      {notice && (
        <div className="fixed top-4 right-4 z-[100] rounded-lg bg-green-600 text-white px-4 py-2.5 text-sm font-medium shadow-lg">
          {notice}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search destinations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          />
        </div>
        <Select
          options={CATEGORY_FILTER_OPTIONS}
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-48"
        />
        <div className="flex-1" />
        <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
          <Upload className="h-4 w-4" /> Bulk Import
        </Button>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Destination
        </Button>
      </div>

      {loading ? (
        <Card>
          <div className="py-12 text-center text-gray-500">Loading destinations...</div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="py-12 text-center text-gray-400">
            <MapPin className="h-10 w-10 mx-auto mb-2 opacity-40" />
            No destinations found.
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Destination</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Region</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Location</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Category</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((dest) => (
                  <tr
                    key={dest.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openDetail(dest)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        openDetail(dest)
                      }
                    }}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-3">
                        {dest.coverImage || dest.images?.[0] ? (
                          <img
                            src={dest.coverImage || dest.images[0]}
                            alt=""
                            className="h-12 w-16 shrink-0 rounded-md object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-400">
                            <MapPin className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-sm font-medium text-brand-700 hover:underline">
                            {dest.name}
                          </span>
                          <span className="block text-xs text-gray-500 mt-0.5 line-clamp-1">
                            {dest.description}
                          </span>
                          {(dest.images?.length || 0) > 0 && (
                            <span className="text-xs text-gray-400">
                              {dest.images.length} photo{dest.images.length === 1 ? "" : "s"}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="text-sm text-gray-700">
                        {DESTINATION_REGIONS.find((r) => r.value === dest.region)?.label || dest.region}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span className="text-sm text-gray-700 tabular-nums">
                        {dest.latitude != null && dest.longitude != null
                          ? `${Number(dest.latitude).toFixed(4)}, ${Number(dest.longitude).toFixed(4)}`
                          : "—"}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <Badge tone={CATEGORY_TONES[dest.category] || "gray"}>
                        {DESTINATION_CATEGORIES.find((c) => c.value === dest.category)?.label || dest.category}
                      </Badge>
                    </td>
                    <td className="py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(dest)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(dest.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <DestinationDetailModal
        open={Boolean(detailDest)}
        destination={detailDest}
        onClose={() => setDetailDest(null)}
        onEdit={openEdit}
      />

      <DestinationFormModal
        open={formOpen}
        destination={editingDest}
        onClose={() => { setFormOpen(false); setEditingDest(null) }}
        onSave={handleSave}
      />

      <BulkImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
      />

      <ConfirmDialog
        open={Boolean(deletingId)}
        title="Delete Destination"
        message="Are you sure you want to delete this destination? This action cannot be undone."
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
