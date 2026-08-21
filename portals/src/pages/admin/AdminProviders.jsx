import { useState } from "react"
import PageHeader from "../../components/common/PageHeader"
import VerificationQueue from "../../components/admin/VerificationQueue"
import ContentModerationBoard from "../../components/admin/ContentModerationBoard"

const TABS = [
  { key: "verification", label: "Verification Queue" },
  { key: "content", label: "Content Moderation" },
]

export default function AdminProviders() {
  const [activeTab, setActiveTab] = useState("verification")

  return (
    <div>
      <PageHeader
        title="Providers"
        description="Verify and moderate hotels, resorts, tour agencies, and car rentals"
      />

      <div className="mt-6 flex gap-1 border-b border-gray-200">
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

      <div className="mt-6">
        {activeTab === "verification" && <VerificationQueue />}
        {activeTab === "content" && <ContentModerationBoard />}
      </div>
    </div>
  )
}
