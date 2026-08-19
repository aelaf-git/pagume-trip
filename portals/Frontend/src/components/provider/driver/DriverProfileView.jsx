import { useState } from "react"
import Input from "../../common/Input"
import Textarea from "../../common/Textarea"
import Checkbox from "../../common/Checkbox"
import Badge from "../../common/Badge"
import Button from "../../common/Button"
import { MapPin, Car, CheckCircle2, Clock, AlertTriangle } from "lucide-react"
import { LANGUAGES_OPTIONS, EXPERIENCE_LEVELS } from "../../../constants/registrationOptions"
import { COVERAGE_AREAS, VERIFICATION_DOC_STATUS } from "../../../constants/inventoryOptions"

const TABS = [
  { key: "details", label: "Profile Details" },
  { key: "rates", label: "Rates & Services" },
  { key: "verification", label: "Verification & Documents" },
]

function Chips({ values }) {
  if (!values || values.length === 0) return <p className="text-sm text-gray-400">None</p>
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((v) => (
        <span key={v} className="inline-block bg-brand-50 text-brand-700 text-xs font-medium px-2.5 py-1 rounded-full">{v}</span>
      ))}
    </div>
  )
}

export default function DriverProfileView({ profileData, verificationDocuments, isEditing, onChange, errors }) {
  const [activeTab, setActiveTab] = useState("details")
  const data = isEditing ? profileData : profileData
  const docs = verificationDocuments || []

  const handle = (field) => (e) => onChange(field, e.target.value)

  const renderDetailsView = () => {
    const expLabel = EXPERIENCE_LEVELS.find((e) => e.value === data.experienceLevel)?.label || data.experienceLevel
    return (
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
            <span className="text-xl font-bold text-brand-700">
              {(data.fullName || "D M").split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{data.fullName || "\u2014"}</h3>
            {data.experienceLevel && (
              <Badge tone="brand">{expLabel}</Badge>
            )}
          </div>
        </div>

        {data.bio && (
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide">Bio</dt>
            <dd className="text-sm text-gray-800 mt-0.5 whitespace-pre-wrap">{data.bio}</dd>
          </div>
        )}

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide">License Number</dt>
            <dd className="text-sm text-gray-800 mt-0.5">{data.licenseNumber || "\u2014"}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide">License Expiry</dt>
            <dd className="text-sm text-gray-800 mt-0.5">{data.licenseExpiry || "\u2014"}</dd>
          </div>
          {data.vehicleAvailable && (
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-gray-400" />
              <div>
                <dt className="text-xs text-gray-400 uppercase tracking-wide">Vehicle</dt>
                <dd className="text-sm text-gray-800 mt-0.5">{data.vehicleType || "Available"}</dd>
              </div>
            </div>
          )}
        </dl>

        <div>
          <dt className="text-xs text-gray-400 uppercase tracking-wide mb-1">Languages</dt>
          <Chips values={data.languages} />
        </div>

        <div>
          <dt className="text-xs text-gray-400 uppercase tracking-wide mb-1">Coverage Areas</dt>
          <Chips values={data.coverage} />
        </div>
      </div>
    )
  }

  const renderDetailsEdit = () => (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input id="fullName" label="Full Name" required value={data.fullName || ""} onChange={handle("fullName")} error={errors?.fullName} />
        <Input id="licenseNumber" label="License Number" required value={data.licenseNumber || ""} onChange={handle("licenseNumber")} error={errors?.licenseNumber} />
        <Input id="licenseExpiry" label="License Expiry" type="date" required value={data.licenseExpiry || ""} onChange={handle("licenseExpiry")} error={errors?.licenseExpiry} />
      </div>
      <Textarea id="bio" label="Bio" rows={3} placeholder="Introduce yourself and your experience..." value={data.bio || ""} onChange={handle("bio")} />

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Languages</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {LANGUAGES_OPTIONS.map((lang) => (
            <Checkbox key={lang} id={`drv-lang-${lang}`} label={lang} checked={(data.languages || []).includes(lang)} onChange={() => {
              const current = data.languages || []
              onChange("languages", current.includes(lang) ? current.filter((l) => l !== lang) : [...current, lang])
            }} />
          ))}
        </div>
        {errors?.languages && <p className="mt-1 text-xs text-red-500">{errors.languages}</p>}
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Coverage Areas</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {(data.coverage || []).map((area) => (
            <span key={area} className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 text-xs font-medium px-2.5 py-1 rounded-full">
              {area}
              <button type="button" onClick={() => onChange("coverage", (data.coverage || []).filter((a) => a !== area))} className="text-brand-400 hover:text-red-500 ml-0.5">&times;</button>
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {COVERAGE_AREAS.filter((a) => !(data.coverage || []).includes(a)).map((area) => (
            <button key={area} type="button" onClick={() => onChange("coverage", [...(data.coverage || []), area])}
              className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:border-brand-500 hover:text-brand-600 transition-colors">
              + {area}
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const renderRatesView = () => (
    <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-gray-50 rounded-lg p-4">
        <dt className="text-xs text-gray-400 uppercase tracking-wide">Guiding Day Rate</dt>
        <dd className="text-lg font-bold text-gray-900 mt-1">ETB {(data.guidingDayRate ?? 0).toLocaleString()}</dd>
        <dd className="text-xs text-gray-400">per day</dd>
      </div>
      <div className="bg-gray-50 rounded-lg p-4">
        <dt className="text-xs text-gray-400 uppercase tracking-wide">Driving Day Rate</dt>
        <dd className="text-lg font-bold text-gray-900 mt-1">ETB {(data.drivingDayRate ?? 0).toLocaleString()}</dd>
        <dd className="text-xs text-gray-400">per day</dd>
      </div>
      <div className="bg-gray-50 rounded-lg p-4">
        <dt className="text-xs text-gray-400 uppercase tracking-wide">Airport Transfer</dt>
        <dd className="text-lg font-bold text-gray-900 mt-1">ETB {(data.airportTransferRate ?? 0).toLocaleString()}</dd>
        <dd className="text-xs text-gray-400">flat rate</dd>
      </div>
    </dl>
  )

  const renderRatesEdit = () => (
    <div className="grid gap-4 sm:grid-cols-3">
      <Input id="guidingDayRate" label="Guiding Day Rate (ETB)" type="number" min="0" required value={data.guidingDayRate ?? ""} onChange={handle("guidingDayRate")} error={errors?.guidingDayRate} />
      <Input id="drivingDayRate" label="Driving Day Rate (ETB)" type="number" min="0" required value={data.drivingDayRate ?? ""} onChange={handle("drivingDayRate")} error={errors?.drivingDayRate} />
      <Input id="airportTransferRate" label="Airport Transfer Rate (ETB)" type="number" min="0" value={data.airportTransferRate ?? ""} onChange={handle("airportTransferRate")} />
    </div>
  )

  const renderVerification = () => (
    <div className="space-y-3">
      {docs.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">No verification documents on file.</p>
      ) : docs.map((doc) => {
        const statusConfig = VERIFICATION_DOC_STATUS[doc.status] || VERIFICATION_DOC_STATUS.PENDING
        return (
          <div key={doc.key} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center gap-3">
              {doc.status === "APPROVED" ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              ) : doc.status === "EXPIRED" ? (
                <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
              ) : (
                <Clock className="h-5 w-5 text-amber-500 shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-800">{doc.label}</p>
                {doc.expiryDate && (
                  <p className="text-xs text-gray-400 mt-0.5">Expires: {doc.expiryDate}</p>
                )}
              </div>
            </div>
            <Badge tone={statusConfig.tone}>{statusConfig.label}</Badge>
          </div>
        )
      })}
    </div>
  )

  const renderTabContent = () => {
    if (activeTab === "details") return isEditing ? renderDetailsEdit() : renderDetailsView()
    if (activeTab === "rates") return isEditing ? renderRatesEdit() : renderRatesView()
    if (activeTab === "verification") return renderVerification()
    return null
  }

  return (
    <div>
      <div className="border-b border-gray-200 -mx-6 px-6 mb-5">
        <nav className="flex gap-0 overflow-x-auto" aria-label="Driver profile tabs">
          {TABS.map((tab) => (
            <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key ? "border-brand-500 text-brand-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      {renderTabContent()}
    </div>
  )
}
