import { useState, useEffect, useCallback, useRef } from "react"
import { Building2 } from "lucide-react"
import Card from "../common/Card"
import Badge from "../common/Badge"
import { VERIFICATION_STATUSES } from "../../constants/verificationOptions"
import { PROVIDER_CATEGORIES } from "../../constants/providerCategories"
import { getProviders, approveProvider, rejectProvider, requestDocuments, suspendProvider } from "../../services/verificationService"
import VerificationDetailDrawer from "./VerificationDetailDrawer"
import ReasonModal from "./ReasonModal"

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "UNDER_REVIEW", label: "Pending" },
  { key: "VERIFIED", label: "Verified" },
  { key: "REJECTED", label: "Rejected" },
  { key: "SUSPENDED", label: "Suspended" },
]



export default function VerificationQueue() {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [selectedProvider, setSelectedProvider] = useState(null)
  const [notice, setNotice] = useState("")
  const noticeTimer = useRef(null)

  const showNotice = useCallback((msg) => {
    setNotice(msg)
    clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNotice(""), 3000)
  }, [])

  const loadProviders = useCallback(async () => {
    const data = await getProviders()
    setProviders(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadProviders()
    return () => clearTimeout(noticeTimer.current)
  }, [loadProviders])

  const filtered = filter === "all" ? providers : providers.filter((p) => p.status === filter)

  const counts = {
    all: providers.length,
    UNDER_REVIEW: providers.filter((p) => p.status === "UNDER_REVIEW").length,
    VERIFIED: providers.filter((p) => p.status === "VERIFIED").length,
    REJECTED: providers.filter((p) => p.status === "REJECTED").length,
    SUSPENDED: providers.filter((p) => p.status === "SUSPENDED").length,
  }

  const refreshAndSelect = async (id) => {
    await loadProviders()
    const updated = (await getProviders()).find((p) => p.id === id)
    if (updated) setSelectedProvider(updated)
  }

  const handleApprove = async () => {
    await approveProvider(selectedProvider.id)
    showNotice("Provider approved successfully")
    await refreshAndSelect(selectedProvider.id)
  }

  const handleReject = async (reason) => {
    await rejectProvider(selectedProvider.id, reason)
    showNotice("Provider rejected")
    await refreshAndSelect(selectedProvider.id)
  }

  const handleRequestDocs = async (reason) => {
    await requestDocuments(selectedProvider.id, reason)
    showNotice("Additional documents requested")
    await refreshAndSelect(selectedProvider.id)
  }

  const handleSuspend = async (reason) => {
    await suspendProvider(selectedProvider.id, reason)
    showNotice("Provider account suspended")
    await refreshAndSelect(selectedProvider.id)
  }

  const [reasonAction, setReasonAction] = useState(null)

  return (
    <div className="space-y-4">
      {notice && (
        <div className="fixed top-4 right-4 z-[100] rounded-lg bg-green-600 text-white px-4 py-2.5 text-sm font-medium shadow-lg animate-slide-in">
          {notice}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((sf) => (
          <button
            key={sf.key}
            onClick={() => setFilter(sf.key)}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              filter === sf.key
                ? "bg-brand-600 text-white border-brand-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {sf.label}
            <span className={`ml-1.5 text-xs ${filter === sf.key ? "text-brand-100" : "text-gray-400"}`}>
              {counts[sf.key]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <Card>
          <div className="py-12 text-center text-gray-500">Loading providers...</div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="py-12 text-center text-gray-400">
            <Building2 className="h-10 w-10 mx-auto mb-2 opacity-40" />
            No providers found for this filter.
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Business Name</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Category</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Registration Date</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((provider) => {
                  const statusConf = VERIFICATION_STATUSES[provider.status]
                  const catConf = PROVIDER_CATEGORIES[provider.category]
                  return (
                    <tr
                      key={provider.id}
                      onClick={() => setSelectedProvider(provider)}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 pr-4">
                        <span className="text-sm font-medium text-gray-900">{provider.businessName}</span>
                        <span className="block text-xs text-gray-500 mt-0.5">{provider.email}</span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="text-sm text-gray-700">{catConf?.label || provider.category}</span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <span className="text-sm text-gray-700">
                          {new Date(provider.registeredAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <Badge tone={statusConf?.tone}>{statusConf?.label}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <VerificationDetailDrawer
        provider={selectedProvider}
        onClose={() => setSelectedProvider(null)}
        onApprove={handleApprove}
        onReject={() => setReasonAction("reject")}
        onRequestDocs={() => setReasonAction("requestDocs")}
        onSuspend={() => setReasonAction("suspend")}
      />

      <ReasonModal
        open={reasonAction === "reject"}
        title="Reject Provider"
        confirmLabel="Reject"
        confirmVariant="danger"
        onClose={() => setReasonAction(null)}
        onConfirm={async (reason) => {
          await handleReject(reason)
          setReasonAction(null)
        }}
      />

      <ReasonModal
        open={reasonAction === "requestDocs"}
        title="Request Additional Documents"
        confirmLabel="Send Request"
        confirmVariant="primary"
        onClose={() => setReasonAction(null)}
        onConfirm={async (reason) => {
          await handleRequestDocs(reason)
          setReasonAction(null)
        }}
      />

      <ReasonModal
        open={reasonAction === "suspend"}
        title="Suspend Provider Account"
        confirmLabel="Suspend"
        confirmVariant="danger"
        onClose={() => setReasonAction(null)}
        onConfirm={async (reason) => {
          await handleSuspend(reason)
          setReasonAction(null)
        }}
      />
    </div>
  )
}
