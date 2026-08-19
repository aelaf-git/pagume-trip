import { useState } from "react"
import Input from "../../common/Input"
import Select from "../../common/Select"
import Textarea from "../../common/Textarea"
import Checkbox from "../../common/Checkbox"
import {
  AGENCY_TYPES,
  CURRENCIES,
  TOUR_TYPES,
  TOUR_SPECIALTIES,
  LANGUAGES_OPTIONS,
  PAYMENT_METHODS,
} from "../../../constants/registrationOptions"

function toggleArray(arr = [], value) {
  const set = new Set(arr)
  if (set.has(value)) set.delete(value)
  else set.add(value)
  return Array.from(set)
}

const TABS = [
  { key: "details", label: "Agency Details" },
  { key: "languages", label: "Languages & Specialties" },
  { key: "contact", label: "Contact & Address" },
]

function Chips({ values, labels }) {
  if (!values || values.length === 0) return <p className="text-sm text-gray-400">None</p>
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((v) => (
        <span key={v} className="inline-block bg-brand-50 text-brand-700 text-xs font-medium px-2.5 py-1 rounded-full">
          {labels?.[v] || v}
        </span>
      ))}
    </div>
  )
}

export default function AgencyProfileView({ profileData, editData, isEditing, onChange, errors }) {
  const [activeTab, setActiveTab] = useState("details")
  const data = isEditing ? editData : profileData

  const handle = (field) => (e) => onChange(field, e.target.value)

  const tourTypeMap = Object.fromEntries(TOUR_TYPES.map((t) => [t.value, t.label]))
  const specialtyLabels = TOUR_SPECIALTIES.reduce((m, s) => ({ ...m, [s]: s }), {})

  const renderDetailsView = () => (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <dt className="text-xs text-gray-400 uppercase tracking-wide">Agency Name</dt>
        <dd className="text-sm text-gray-800 mt-0.5">{data.agencyName || "—"}</dd>
      </div>
      <div>
        <dt className="text-xs text-gray-400 uppercase tracking-wide">License / Registration No.</dt>
        <dd className="text-sm text-gray-800 mt-0.5">{data.businessRegistration || "—"}</dd>
      </div>
      <div>
        <dt className="text-xs text-gray-400 uppercase tracking-wide">Agency Type</dt>
        <dd className="text-sm text-gray-800 mt-0.5">
          {AGENCY_TYPES.find((t) => t.value === data.agencyType)?.label || data.agencyType || "—"}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-gray-400 uppercase tracking-wide">Year Established</dt>
        <dd className="text-sm text-gray-800 mt-0.5">{data.yearEstablished || "—"}</dd>
      </div>
      <div>
        <dt className="text-xs text-gray-400 uppercase tracking-wide">Currency</dt>
        <dd className="text-sm text-gray-800 mt-0.5">
          {CURRENCIES.find((c) => c.value === data.currency)?.label || data.currency || "—"}
        </dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-xs text-gray-400 uppercase tracking-wide">Description</dt>
        <dd className="text-sm text-gray-800 mt-0.5 whitespace-pre-wrap">{data.description || "—"}</dd>
      </div>
    </dl>
  )

  const renderDetailsEdit = () => (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input id="agencyName" label="Agency Name" required value={data.agencyName || ""} onChange={handle("agencyName")} error={errors?.agencyName} />
      <Input id="businessRegistration" label="License / Registration No." required value={data.businessRegistration || ""} onChange={handle("businessRegistration")} error={errors?.businessRegistration} />
      <Select id="agencyType" label="Agency Type" options={AGENCY_TYPES} value={data.agencyType || ""} onChange={handle("agencyType")} />
      <Input id="yearEstablished" label="Year Established" type="number" min="1900" max="2026" value={data.yearEstablished || ""} onChange={handle("yearEstablished")} />
      <Select id="currency" label="Currency" options={CURRENCIES} value={data.currency || ""} onChange={handle("currency")} />
      <div className="sm:col-span-2">
        <Textarea id="description" label="Description" rows={3} value={data.description || ""} onChange={handle("description")} />
      </div>
    </div>
  )

  const renderLanguagesView = () => (
    <div className="space-y-5">
      <div>
        <dt className="text-xs text-gray-400 uppercase tracking-wide mb-1">Primary Languages</dt>
        <Chips values={data.primaryLanguages} />
      </div>
      <div>
        <dt className="text-xs text-gray-400 uppercase tracking-wide mb-1">Specialties</dt>
        <Chips values={data.specialties} labels={specialtyLabels} />
      </div>
      <div>
        <dt className="text-xs text-gray-400 uppercase tracking-wide mb-1">Tour Types</dt>
        <Chips values={data.tourTypes} labels={tourTypeMap} />
      </div>
      <div>
        <dt className="text-xs text-gray-400 uppercase tracking-wide mb-1">Payment Methods</dt>
        <Chips values={data.paymentMethods} labels={Object.fromEntries(PAYMENT_METHODS.map((p) => [p.value, p.label]))} />
      </div>
    </div>
  )

  const renderLanguagesEdit = () => (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Primary Languages</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {LANGUAGES_OPTIONS.map((lang) => (
            <Checkbox key={lang} id={`lang-${lang}`} label={lang} checked={(data.primaryLanguages || []).includes(lang)} onChange={() => onChange("primaryLanguages", toggleArray(data.primaryLanguages, lang))} />
          ))}
        </div>
        {errors?.primaryLanguages && <p className="mt-1 text-xs text-red-500">{errors.primaryLanguages}</p>}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Specialties</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {TOUR_SPECIALTIES.map((s) => (
            <Checkbox key={s} id={`spec-${s}`} label={s} checked={(data.specialties || []).includes(s)} onChange={() => onChange("specialties", toggleArray(data.specialties, s))} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Tour Types</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {TOUR_TYPES.map((t) => (
            <Checkbox key={t.value} id={`tour-${t.value}`} label={t.label} checked={(data.tourTypes || []).includes(t.value)} onChange={() => onChange("tourTypes", toggleArray(data.tourTypes, t.value))} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Payment Methods</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {PAYMENT_METHODS.map((p) => (
            <Checkbox key={p.value} id={`pay-${p.value}`} label={p.label} checked={(data.paymentMethods || []).includes(p.value)} onChange={() => onChange("paymentMethods", toggleArray(data.paymentMethods, p.value))} />
          ))}
        </div>
      </div>
    </div>
  )

  const renderContactView = () => (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <dt className="text-xs text-gray-400 uppercase tracking-wide">Physical Address</dt>
        <dd className="text-sm text-gray-800 mt-0.5">{data.physicalAddress || "—"}</dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-xs text-gray-400 uppercase tracking-wide">Description</dt>
        <dd className="text-sm text-gray-800 mt-0.5 whitespace-pre-wrap">{data.description || "—"}</dd>
      </div>
    </dl>
  )

  const renderContactEdit = () => (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Input id="physicalAddress" label="Physical Address" value={data.physicalAddress || ""} onChange={handle("physicalAddress")} />
      </div>
      <div className="sm:col-span-2">
        <Textarea id="description" label="Description" rows={3} value={data.description || ""} onChange={handle("description")} />
      </div>
    </div>
  )

  const renderTabContent = () => {
    if (activeTab === "details") return isEditing ? renderDetailsEdit() : renderDetailsView()
    if (activeTab === "languages") return isEditing ? renderLanguagesEdit() : renderLanguagesView()
    if (activeTab === "contact") return isEditing ? renderContactEdit() : renderContactView()
    return null
  }

  return (
    <div>
      <div className="border-b border-gray-200 -mx-6 px-6 mb-5">
        <nav className="flex gap-0 overflow-x-auto" aria-label="Agency profile tabs">
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
