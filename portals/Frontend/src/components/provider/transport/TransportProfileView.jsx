import { useState } from "react"
import Input from "../../common/Input"
import Select from "../../common/Select"
import Textarea from "../../common/Textarea"
import Checkbox from "../../common/Checkbox"
import Button from "../../common/Button"
import { Plus, X, CheckCircle2, Clock, FileText } from "lucide-react"
import {
  VEHICLE_TYPES,
  TRANSMISSION_TYPES,
  CURRENCIES,
  PAYMENT_METHODS,
  FLEET_SIZE_RANGES,
} from "../../../constants/registrationOptions"
import { DOCUMENT_REQUIREMENTS } from "../../../constants/documentRequirements"

const TABS = [
  { key: "company", label: "Company Info" },
  { key: "locations", label: "Locations & Branches" },
  { key: "contact", label: "Contact & Documents" },
]

function LocationListEditor({ label, locations, isEditing, onChange, errors }) {
  const [input, setInput] = useState("")

  const handleAdd = () => {
    const trimmed = input.trim()
    if (!trimmed) return
    onChange([...locations, trimmed])
    setInput("")
  }

  const handleRemove = (index) => {
    onChange(locations.filter((_, i) => i !== index))
  }

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
      {isEditing && (
        <div className="flex items-center gap-2 mb-3">
          <Input value={input} placeholder="Type a location and press Add" onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd() } }} />
          <Button type="button" variant="outline" onClick={handleAdd} className="shrink-0">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      )}
      {locations.length === 0 ? (
        <p className="text-xs text-gray-400">No locations added.</p>
      ) : (
        <ul className="space-y-1.5">
          {locations.map((loc, i) => (
            <li key={`${loc}-${i}`} className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700">
              <span>{loc}</span>
              {isEditing && (
                <button type="button" onClick={() => handleRemove(i)} className="text-gray-400 hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {errors && <p className="mt-1 text-xs text-red-500">{errors}</p>}
    </div>
  )
}

function DocumentsCard({ providerType, documents }) {
  return (
    <Card title="Uploaded Documents">
      <ul className="divide-y divide-gray-100">
        {(DOCUMENT_REQUIREMENTS[providerType] || []).map((doc) => {
          const uploaded = documents[doc.key]?.status === "success"
          return (
            <li key={doc.key} className="flex items-center justify-between py-2.5 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{doc.label}</span>
                {!doc.required && <span className="text-xs text-gray-400">(optional)</span>}
              </div>
              {uploaded ? (
                <span className="flex items-center gap-1.5 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="truncate max-w-[180px]">{documents[doc.key].name}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-500">
                  <Clock className="h-4 w-4" /> Not uploaded
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      {title && (
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}

export default function TransportProfileView({ profileData, documents, isEditing, onChange, errors, updatedAt }) {
  const [activeTab, setActiveTab] = useState("company")
  const data = profileData

  const toggleArrayValue = (field, value) => {
    const current = data[field] ?? []
    onChange(field, current.includes(value) ? current.filter((v) => v !== value) : [...current, value])
  }

  const renderCompanyView = () => (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <dt className="text-xs text-gray-400 uppercase tracking-wide">Company Name</dt>
        <dd className="text-sm text-gray-800 mt-0.5">{data.companyName || "\u2014"}</dd>
      </div>
      <div>
        <dt className="text-xs text-gray-400 uppercase tracking-wide">Fleet Size</dt>
        <dd className="text-sm text-gray-800 mt-0.5">{FLEET_SIZE_RANGES.find((f) => f.value === data.fleetSize)?.label || data.fleetSize || "\u2014"}</dd>
      </div>
      <div>
        <dt className="text-xs text-gray-400 uppercase tracking-wide">Transmission Preference</dt>
        <dd className="text-sm text-gray-800 mt-0.5">{TRANSMISSION_TYPES.find((t) => t.value === data.transmission)?.label || "\u2014"}</dd>
      </div>
      <div>
        <dt className="text-xs text-gray-400 uppercase tracking-wide">Currency</dt>
        <dd className="text-sm text-gray-800 mt-0.5">{CURRENCIES.find((c) => c.value === data.currency)?.label || data.currency || "\u2014"}</dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-xs text-gray-400 uppercase tracking-wide">Vehicle Types</dt>
        <dd className="text-sm text-gray-800 mt-1">
          {(data.vehicleTypes || []).length === 0 ? "\u2014" : (
            <div className="flex flex-wrap gap-1.5">
              {data.vehicleTypes.map((v) => (
                <span key={v} className="inline-block bg-brand-50 text-brand-700 text-xs font-medium px-2.5 py-1 rounded-full">
                  {VEHICLE_TYPES.find((t) => t.value === v)?.label || v}
                </span>
              ))}
            </div>
          )}
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-xs text-gray-400 uppercase tracking-wide">Description</dt>
        <dd className="text-sm text-gray-800 mt-0.5 whitespace-pre-wrap">{data.description || "\u2014"}</dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-xs text-gray-400 uppercase tracking-wide">Payment Methods</dt>
        <dd className="text-sm text-gray-800 mt-1">
          {(data.paymentMethods || []).length === 0 ? "\u2014" : (
            <div className="flex flex-wrap gap-1.5">
              {data.paymentMethods.map((p) => (
                <span key={p} className="inline-block bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
                  {PAYMENT_METHODS.find((pm) => pm.value === p)?.label || p}
                </span>
              ))}
            </div>
          )}
        </dd>
      </div>
    </dl>
  )

  const renderCompanyEdit = () => (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input id="companyName" label="Company Name" required value={data.companyName || ""} onChange={(e) => onChange("companyName", e.target.value)} error={errors?.companyName} />
      <Select id="fleetSize" label="Fleet Size" options={FLEET_SIZE_RANGES} value={data.fleetSize || ""} onChange={(e) => onChange("fleetSize", e.target.value)} error={errors?.fleetSize} required />
      <Select id="transmission" label="Transmission Preference" options={TRANSMISSION_TYPES} value={data.transmission || ""} onChange={(e) => onChange("transmission", e.target.value)} />
      <Select id="currency" label="Currency" options={CURRENCIES} value={data.currency || ""} onChange={(e) => onChange("currency", e.target.value)} />
      <div className="sm:col-span-2">
        <p className="text-sm font-medium text-gray-700 mb-2">Vehicle Types</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {VEHICLE_TYPES.map((vt) => (
            <Checkbox key={vt.value} id={`vtype-${vt.value}`} label={vt.label} checked={(data.vehicleTypes || []).includes(vt.value)} onChange={() => toggleArrayValue("vehicleTypes", vt.value)} />
          ))}
        </div>
      </div>
      <div className="sm:col-span-2">
        <Textarea id="description" label="Description" rows={3} value={data.description || ""} onChange={(e) => onChange("description", e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <p className="text-sm font-medium text-gray-700 mb-2">Payment Methods</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {PAYMENT_METHODS.map((pm) => (
            <Checkbox key={pm.value} id={`pay-${pm.value}`} label={pm.label} checked={(data.paymentMethods || []).includes(pm.value)} onChange={() => toggleArrayValue("paymentMethods", pm.value)} />
          ))}
        </div>
      </div>
    </div>
  )

  const renderLocationsView = () => (
    <div className="space-y-6">
      <div>
        <dt className="text-xs text-gray-400 uppercase tracking-wide mb-1">Main Office / Pickup Locations</dt>
        <div className="flex flex-wrap gap-1.5">
          {(data.pickupLocations || []).length === 0 ? <p className="text-sm text-gray-400">\u2014</p> : (
            data.pickupLocations.map((loc, i) => (
              <span key={i} className="inline-block bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">{loc}</span>
            ))
          )}
        </div>
      </div>
      <div>
        <dt className="text-xs text-gray-400 uppercase tracking-wide mb-1">Drop-off Locations</dt>
        <div className="flex flex-wrap gap-1.5">
          {(data.dropoffLocations || []).length === 0 ? <p className="text-sm text-gray-400">\u2014</p> : (
            data.dropoffLocations.map((loc, i) => (
              <span key={i} className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">{loc}</span>
            ))
          )}
        </div>
      </div>
    </div>
  )

  const renderLocationsEdit = () => (
    <div className="space-y-6">
      <LocationListEditor
        label="Pickup Locations"
        locations={data.pickupLocations || []}
        isEditing={isEditing}
        onChange={(locs) => onChange("pickupLocations", locs)}
        errors={errors?.pickupLocations}
      />
      <LocationListEditor
        label="Drop-off Locations"
        locations={data.dropoffLocations || []}
        isEditing={isEditing}
        onChange={(locs) => onChange("dropoffLocations", locs)}
        errors={errors?.dropoffLocations}
      />
    </div>
  )

  const renderContactView = () => (
    <div className="space-y-6">
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <dt className="text-xs text-gray-400 uppercase tracking-wide">Emergency Contact Name</dt>
          <dd className="text-sm text-gray-800 mt-0.5">{data.emergencyContactName || "\u2014"}</dd>
        </div>
        <div>
          <dt className="text-xs text-gray-400 uppercase tracking-wide">Emergency Contact Phone</dt>
          <dd className="text-sm text-gray-800 mt-0.5">{data.emergencyContactPhone || "\u2014"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-gray-400 uppercase tracking-wide">Emergency Contact Email</dt>
          <dd className="text-sm text-gray-800 mt-0.5">{data.emergencyContactEmail || "\u2014"}</dd>
        </div>
      </dl>
    </div>
  )

  const renderContactEdit = () => (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input id="emergencyContactName" label="Emergency Contact Name" value={data.emergencyContactName || ""} onChange={(e) => onChange("emergencyContactName", e.target.value)} />
      <Input id="emergencyContactPhone" label="Emergency Contact Phone" value={data.emergencyContactPhone || ""} onChange={(e) => onChange("emergencyContactPhone", e.target.value)} />
      <div className="sm:col-span-2">
        <Input id="emergencyContactEmail" label="Emergency Contact Email" type="email" value={data.emergencyContactEmail || ""} onChange={(e) => onChange("emergencyContactEmail", e.target.value)} />
      </div>
    </div>
  )

  const renderTabContent = () => {
    if (activeTab === "company") return isEditing ? renderCompanyEdit() : renderCompanyView()
    if (activeTab === "locations") return isEditing ? renderLocationsEdit() : renderLocationsView()
    if (activeTab === "contact") return isEditing ? renderContactEdit() : renderContactView()
    return null
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="border-b border-gray-200 -mx-6 px-6 mb-5">
          <nav className="flex gap-0 overflow-x-auto" aria-label="Transport profile tabs">
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
      </Card>

      {updatedAt && (
        <p className="text-xs text-gray-400 text-right">
          Last updated: {new Date(updatedAt).toLocaleDateString()}
        </p>
      )}

      <DocumentsCard providerType="transport" documents={documents} />
    </div>
  )
}
