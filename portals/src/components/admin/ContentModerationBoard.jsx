import { useState, useEffect, useCallback, useRef } from "react"
import { ImageIcon, FileText, Video, Package, CheckCircle2, Flag, Pencil, Image } from "lucide-react"
import Card from "../common/Card"
import Badge from "../common/Badge"
import Button from "../common/Button"
import { CONTENT_TYPES, MODERATION_STATUSES } from "../../constants/contentModerationOptions"
import { getContentItems, approveContent, flagContent, requestEdit } from "../../services/contentModerationService"
import ReasonModal from "./ReasonModal"

const CONTENT_TYPE_ICONS = {
  IMAGE: ImageIcon,
  DESCRIPTION: FileText,
  VIDEO: Video,
  PACKAGE: Package,
}

const TYPE_FILTERS = [
  { key: "all", label: "All" },
  { key: "IMAGE", label: "Images" },
  { key: "DESCRIPTION", label: "Descriptions" },
  { key: "VIDEO", label: "Videos" },
  { key: "PACKAGE", label: "Packages" },
]

export default function ContentModerationBoard() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState("all")
  const [notice, setNotice] = useState("")
  const noticeTimer = useRef(null)
  const [reasonAction, setReasonAction] = useState(null)
  const [reasonTarget, setReasonTarget] = useState(null)

  const showNotice = useCallback((msg) => {
    setNotice(msg)
    clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNotice(""), 3000)
  }, [])

  const loadItems = useCallback(async () => {
    const data = await getContentItems()
    setItems(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadItems()
    return () => clearTimeout(noticeTimer.current)
  }, [loadItems])

  const filtered = typeFilter === "all" ? items : items.filter((c) => c.contentType === typeFilter)

  const pendingCount = items.filter((c) => c.status === "PENDING_REVIEW").length

  const handleApprove = async (id) => {
    await approveContent(id)
    showNotice("Content approved")
    loadItems()
  }

  const handleFlag = (id) => {
    setReasonTarget(id)
    setReasonAction("flag")
  }

  const handleRequestEdit = (id) => {
    setReasonTarget(id)
    setReasonAction("edit")
  }

  const handleFlagConfirm = async (reason) => {
    await flagContent(reasonTarget, reason)
    showNotice("Content flagged")
    setReasonAction(null)
    setReasonTarget(null)
    loadItems()
  }

  const handleEditConfirm = async (reason) => {
    await requestEdit(reasonTarget, reason)
    showNotice("Edit requested")
    setReasonAction(null)
    setReasonTarget(null)
    loadItems()
  }

  return (
    <div className="space-y-4">
      {notice && (
        <div className="fixed top-4 right-4 z-[100] rounded-lg bg-green-600 text-white px-4 py-2.5 text-sm font-medium shadow-lg animate-slide-in">
          {notice}
        </div>
      )}

      <div className="flex items-center gap-4">
        <div className="flex flex-wrap gap-2 flex-1">
          {TYPE_FILTERS.map((tf) => (
            <button
              key={tf.key}
              onClick={() => setTypeFilter(tf.key)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                typeFilter === tf.key
                  ? "bg-brand-600 text-white border-brand-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
        {pendingCount > 0 && (
          <span className="text-sm text-amber-600 font-medium whitespace-nowrap">
            {pendingCount} pending review
          </span>
        )}
      </div>

      {loading ? (
        <Card>
          <div className="py-12 text-center text-gray-500">Loading content...</div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="py-12 text-center text-gray-400">
            <Image className="h-10 w-10 mx-auto mb-2 opacity-40" />
            No content found for this filter.
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const typeConf = CONTENT_TYPES[item.contentType]
            const statusConf = MODERATION_STATUSES[item.status]
            const Icon = CONTENT_TYPE_ICONS[item.contentType] || FileText

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">{item.title}</p>
                      <p className="text-xs text-gray-500">{typeConf?.label}</p>
                    </div>
                  </div>
                  <Badge tone={statusConf?.tone}>{statusConf?.label}</Badge>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 flex-1">{item.description}</p>

                <div className="text-xs text-gray-400">
                  <span className="font-medium text-gray-600">{item.providerName}</span>
                  <span className="mx-1.5">&middot;</span>
                  {new Date(item.uploadedAt).toLocaleDateString()}
                </div>

                {item.flagReason && (
                  <div className="rounded-lg bg-red-50 border border-red-100 p-2.5 text-xs text-red-700">
                    <span className="font-medium">Flagged:</span> {item.flagReason}
                  </div>
                )}

                {item.editNote && (
                  <div className="rounded-lg bg-brand-50 border border-brand-100 p-2.5 text-xs text-brand-700">
                    <span className="font-medium">Edit note:</span> {item.editNote}
                  </div>
                )}

                {item.status === "PENDING_REVIEW" && (
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="primary" onClick={() => handleApprove(item.id)}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleFlag(item.id)}>
                      <Flag className="h-3.5 w-3.5 mr-1" /> Flag
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleRequestEdit(item.id)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Request Edit
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <ReasonModal
        open={reasonAction === "flag"}
        title="Flag / Reject Content"
        confirmLabel="Flag Content"
        confirmVariant="danger"
        onClose={() => { setReasonAction(null); setReasonTarget(null) }}
        onConfirm={handleFlagConfirm}
      />

      <ReasonModal
        open={reasonAction === "edit"}
        title="Request Content Edit"
        confirmLabel="Send Request"
        confirmVariant="primary"
        onClose={() => { setReasonAction(null); setReasonTarget(null) }}
        onConfirm={handleEditConfirm}
      />
    </div>
  )
}
