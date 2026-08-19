import { useCallback, useEffect, useRef, useState } from "react"
import { Plus, Pencil, Trash2, CarFront, Search, Settings, MapPin } from "lucide-react"
import Card from "../common/Card"
import Button from "../common/Button"
import Input from "../common/Input"
import Select from "../common/Select"
import Textarea from "../common/Textarea"
import Checkbox from "../common/Checkbox"
import Badge from "../common/Badge"
import Modal from "../common/Modal"
import ConfirmDialog from "../common/ConfirmDialog"
import { TRANSMISSION_TYPES } from "../../constants/registrationOptions"
import {
  FUEL_TYPES,
  DRIVER_AVAILABILITY_OPTIONS,
  VEHICLE_STATUS_OPTIONS,
  VEHICLE_STATUS_TONES,
  INSURANCE_COVER_OPTIONS,
  VEHICLE_SPECIFIC_FEATURES,
  FUEL_POLICY_OPTIONS,
  MILEAGE_OPTIONS,
} from "../../constants/inventoryOptions"
import { validateVehicle } from "../../utils/inventoryValidation"
import * as inventoryService from "../../services/inventoryService"

const EMPTY_FORM = {
  make: "",
  model: "",
  year: "",
  seats: "",
  luggageCapacity: "",
  plateNumber: "",
  transmission: "",
  fuelType: "",
  fourWheelDrive: false,
  dailyPrice: "",
  weeklyPrice: "",
  deposit: "",
  insurance: "",
  driverAvailability: "",
  status: "active",
  features: [],
  branchLocation: "",
  image: "",
}

const OPTION_LABELS = (opts) => Object.fromEntries(opts.map(({ value, label }) => [value, label]))
const TRANSMISSION_LABELS = OPTION_LABELS(TRANSMISSION_TYPES)
const FUEL_LABELS = OPTION_LABELS(FUEL_TYPES)
const DRIVER_LABELS = OPTION_LABELS(DRIVER_AVAILABILITY_OPTIONS)
const STATUS_LABELS = OPTION_LABELS(VEHICLE_STATUS_OPTIONS)
const INSURANCE_LABELS = OPTION_LABELS(INSURANCE_COVER_OPTIONS)

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "rented", label: "Rented" },
  { key: "maintenance", label: "Maintenance" },
]

const BRANCH_OPTIONS = [
  "Bole International Airport",
  "Piazza",
  "Merkato",
  "Bole Medhanealem",
  "Addis Ketema",
]

function VehicleCard({ vehicle, onEdit, onDelete, onStatusChange }) {
  return (
    <div className="group bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-44 bg-gray-100">
        {vehicle.image ? (
          <img src={vehicle.image} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-full object-cover" draggable={false} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <CarFront className="h-12 w-12 text-gray-300" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <Badge tone={VEHICLE_STATUS_TONES[vehicle.status] || "gray"}>
            {STATUS_LABELS[vehicle.status] || vehicle.status}
          </Badge>
          {vehicle.fourWheelDrive && <Badge tone="brand">4WD</Badge>}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight">
          {vehicle.make} {vehicle.model}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5 font-mono">{vehicle.plateNumber}</p>

        <div className="flex flex-wrap gap-1.5 mt-2.5">
          <span className="inline-flex items-center text-xs text-gray-600 bg-gray-100 rounded px-2 py-0.5">
            {vehicle.year}
          </span>
          <span className="inline-flex items-center text-xs text-gray-600 bg-gray-100 rounded px-2 py-0.5">
            {TRANSMISSION_LABELS[vehicle.transmission] || vehicle.transmission}
          </span>
          <span className="inline-flex items-center text-xs text-gray-600 bg-gray-100 rounded px-2 py-0.5">
            {FUEL_LABELS[vehicle.fuelType] || vehicle.fuelType}
          </span>
          <span className="inline-flex items-center text-xs text-gray-600 bg-gray-100 rounded px-2 py-0.5">
            {vehicle.seats} seats
          </span>
          <span className="inline-flex items-center text-xs text-gray-600 bg-gray-100 rounded px-2 py-0.5">
            {vehicle.luggageCapacity} bags
          </span>
        </div>

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <div>
            <span className="text-sm font-bold text-gray-900">ETB {(vehicle.dailyPrice ?? 0).toLocaleString()}</span>
            <span className="text-xs text-gray-400"> /day</span>
          </div>
          <span className="text-xs text-gray-400">
            Deposit: ETB {(vehicle.deposit ?? 0).toLocaleString()}
          </span>
        </div>

        {vehicle.branchLocation && (
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
            <MapPin className="h-3 w-3" />
            {vehicle.branchLocation}
          </div>
        )}

        <div className="flex items-center gap-1 mt-3">
          <select value={vehicle.status || "active"} onChange={(e) => onStatusChange(vehicle, e.target.value)}
            className="flex-1 text-xs font-medium rounded-lg px-2 py-2 border border-gray-200 bg-white focus:ring-2 focus:ring-brand-500/30 outline-none cursor-pointer">
            {VEHICLE_STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button type="button" onClick={() => onEdit(vehicle)}
            className="inline-flex items-center justify-center text-xs font-medium rounded-lg p-2 bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors"
            title="Edit vehicle">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => onDelete(vehicle)}
            className="inline-flex items-center justify-center text-xs font-medium rounded-lg p-2 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            title="Delete vehicle">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function VehicleFleetManagement() {
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("fleet")

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [notice, setNotice] = useState(null)
  const noticeTimer = useRef(null)

  const [rentalTerms, setRentalTerms] = useState(null)
  const [termsLoading, setTermsLoading] = useState(true)
  const [termsSaving, setTermsSaving] = useState(false)
  const [termsForm, setTermsForm] = useState(null)
  const [termsEditing, setTermsEditing] = useState(false)
  const [termsErrors, setTermsErrors] = useState({})
  const [newRestriction, setNewRestriction] = useState("")

  const showNotice = (message) => {
    setNotice(message)
    clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNotice(null), 3000)
  }

  useEffect(() => () => clearTimeout(noticeTimer.current), [])

  const loadVehicles = useCallback(async () => {
    const data = await inventoryService.getVehicles()
    setVehicles(data)
    setLoading(false)
  }, [])

  const loadTerms = useCallback(async () => {
    const data = await inventoryService.getRentalTerms()
    setRentalTerms(data)
    setTermsForm(data)
    setTermsLoading(false)
  }, [])

  useEffect(() => {
    loadVehicles()
    loadTerms()
  }, [loadVehicles, loadTerms])

  const filtered = vehicles.filter((v) => {
    if (filter !== "all" && v.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        v.make?.toLowerCase().includes(q) ||
        v.model?.toLowerCase().includes(q) ||
        v.plateNumber?.toLowerCase().includes(q)
      )
    }
    return true
  })

  const counts = {
    all: vehicles.length,
    active: vehicles.filter((v) => v.status === "active").length,
    rented: vehicles.filter((v) => v.status === "rented").length,
    maintenance: vehicles.filter((v) => v.status === "maintenance").length,
  }

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (vehicle) => {
    setEditing(vehicle)
    setForm({
      make: vehicle.make || "",
      model: vehicle.model || "",
      year: String(vehicle.year ?? ""),
      seats: String(vehicle.seats ?? ""),
      luggageCapacity: String(vehicle.luggageCapacity ?? ""),
      plateNumber: vehicle.plateNumber || "",
      transmission: vehicle.transmission || "",
      fuelType: vehicle.fuelType || "",
      fourWheelDrive: Boolean(vehicle.fourWheelDrive),
      dailyPrice: String(vehicle.dailyPrice ?? ""),
      weeklyPrice: String(vehicle.weeklyPrice ?? ""),
      deposit: String(vehicle.deposit ?? ""),
      insurance: vehicle.insurance || "",
      driverAvailability: vehicle.driverAvailability || "",
      status: vehicle.status || "active",
      features: vehicle.features ?? [],
      branchLocation: vehicle.branchLocation || "",
      image: vehicle.image || "",
    })
    setErrors({})
    setModalOpen(true)
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const toggleFeature = (feature) => {
    const current = form.features || []
    handleChange("features", current.includes(feature) ? current.filter((f) => f !== feature) : [...current, feature])
  }

  const handleSave = async () => {
    const validationErrors = validateVehicle(form)
    if (Object.keys(validationErrors).length > 0) return setErrors(validationErrors)

    setSaving(true)
    const payload = {
      make: form.make,
      model: form.model,
      year: Number(form.year),
      seats: Number(form.seats),
      luggageCapacity: Number(form.luggageCapacity) || 0,
      plateNumber: form.plateNumber.trim().toUpperCase(),
      transmission: form.transmission,
      fuelType: form.fuelType,
      fourWheelDrive: form.fourWheelDrive,
      dailyPrice: Number(form.dailyPrice),
      weeklyPrice: Number(form.weeklyPrice),
      deposit: Number(form.deposit),
      insurance: form.insurance,
      driverAvailability: form.driverAvailability,
      status: form.status,
      features: form.features,
      branchLocation: form.branchLocation,
      image: form.image,
    }

    try {
      if (editing) {
        await inventoryService.updateVehicle(editing.id, payload)
        showNotice("Vehicle updated.")
      } else {
        await inventoryService.createVehicle(payload)
        showNotice("Vehicle added to your fleet.")
      }
      setModalOpen(false)
      await loadVehicles()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeletingId(deleting.id)
    try {
      await inventoryService.deleteVehicle(deleting.id)
      showNotice("Vehicle removed from your fleet.")
      setDeleting(null)
      await loadVehicles()
    } finally {
      setDeletingId(null)
    }
  }

  const handleStatusChange = async (vehicle, newStatus) => {
    await inventoryService.updateVehicle(vehicle.id, { status: newStatus })
    showNotice(`"${vehicle.make} ${vehicle.model}" marked as ${STATUS_LABELS[newStatus]}.`)
    await loadVehicles()
  }

  const handleTermsChange = (field, value) => {
    setTermsForm((prev) => ({ ...prev, [field]: value }))
    setTermsErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleTermsSave = async () => {
    const errs = {}
    if (Number(termsForm.lateReturnChargePerHour) < 0) errs.lateReturnChargePerHour = "Must be 0 or more."
    if (Number(termsForm.lateReturnChargePerDay) < 0) errs.lateReturnChargePerDay = "Must be 0 or more."
    if (termsForm.minimumRentalDays < 1) errs.minimumRentalDays = "Must be at least 1."
    if (Number(termsForm.maximumRentalDays) < Number(termsForm.minimumRentalDays)) errs.maximumRentalDays = "Must be >= minimum."
    if (termsForm.mileagePolicy === "daily_limit" && (!termsForm.dailyMileageLimit || Number(termsForm.dailyMileageLimit) < 1)) {
      errs.dailyMileageLimit = "Set a daily mileage limit."
    }
    if (termsForm.mileagePolicy === "total_limit" && (!termsForm.totalMileageLimit || Number(termsForm.totalMileageLimit) < 1)) {
      errs.totalMileageLimit = "Set a total mileage limit."
    }
    if (Object.keys(errs).length > 0) return setTermsErrors(errs)

    setTermsSaving(true)
    try {
      const saved = await inventoryService.updateRentalTerms(termsForm)
      setRentalTerms(saved)
      setTermsEditing(false)
      showNotice("Rental terms updated.")
    } finally {
      setTermsSaving(false)
    }
  }

  const addRestriction = () => {
    const trimmed = newRestriction.trim()
    if (!trimmed) return
    handleTermsChange("geographicRestrictions", [...(termsForm.geographicRestrictions || []), trimmed])
    setNewRestriction("")
  }

  const removeRestriction = (index) => {
    handleTermsChange("geographicRestrictions", (termsForm.geographicRestrictions || []).filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      {notice && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{notice}</div>
      )}

      <div className="border-b border-gray-200">
        <nav className="flex gap-0 -mb-px" aria-label="Fleet management tabs">
          {[
            { key: "fleet", label: "Vehicle Fleet", icon: CarFront },
            { key: "terms", label: "Rental Terms", icon: Settings },
          ].map((tab) => (
            <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-brand-500 text-brand-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}>
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "fleet" ? (
        <>
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
                <input type="text" placeholder="Search make, model, plate..." value={search} onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none w-52" />
              </div>
              <Button onClick={openCreate} size="sm">
                <Plus className="h-4 w-4" /> Add Vehicle
              </Button>
            </div>
          </div>

          {loading ? (
            <Card>
              <div className="py-12 text-center text-sm text-gray-400">Loading fleet...</div>
            </Card>
          ) : filtered.length === 0 ? (
            <Card>
              <div className="flex flex-col items-center py-12 text-center">
                <CarFront className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">
                  {vehicles.length === 0 ? "No vehicles yet. Add your first vehicle to start renting." : "No vehicles match your filters."}
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} onEdit={openEdit} onDelete={setDeleting} onStatusChange={handleStatusChange} />
              ))}
            </div>
          )}
        </>
      ) : (
        <Card title="Rental Terms & Configuration">
          {termsLoading ? (
            <div className="py-12 text-center text-sm text-gray-400">Loading rental terms...</div>
          ) : !termsForm ? (
            <div className="py-12 text-center text-sm text-gray-400">No rental terms configured.</div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {termsEditing ? "Editing rental terms" : "View-only — click Edit to make changes"}
                </p>
                <div className="flex gap-2">
                  {termsEditing ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => { setTermsForm(rentalTerms); setTermsEditing(false); setTermsErrors({}) }}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleTermsSave} loading={termsSaving}>
                        Save Terms
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={() => setTermsEditing(true)}>
                      <Pencil className="h-4 w-4" /> Edit Terms
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Late Return Charges</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input id="late-hour" label="Per Hour (ETB)" type="number" min="0" disabled={!termsEditing} value={termsForm.lateReturnChargePerHour ?? ""} onChange={(e) => handleTermsChange("lateReturnChargePerHour", Number(e.target.value))} error={termsErrors.lateReturnChargePerHour} />
                    <Input id="late-day" label="Per Day (ETB)" type="number" min="0" disabled={!termsEditing} value={termsForm.lateReturnChargePerDay ?? ""} onChange={(e) => handleTermsChange("lateReturnChargePerDay", Number(e.target.value))} error={termsErrors.lateReturnChargePerDay} />
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Fuel Policy</h4>
                  <Select id="fuel-policy" label="Fuel Policy" options={FUEL_POLICY_OPTIONS} value={termsForm.fuelPolicy || ""} disabled={!termsEditing} onChange={(e) => handleTermsChange("fuelPolicy", e.target.value)} />
                </div>
              </div>

              <hr className="border-gray-200" />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Mileage Policy</h4>
                  <Select id="mileage-policy" options={MILEAGE_OPTIONS} value={termsForm.mileagePolicy || ""} disabled={!termsEditing} onChange={(e) => handleTermsChange("mileagePolicy", e.target.value)} />
                  {termsForm.mileagePolicy === "daily_limit" && (
                    <div className="mt-3">
                      <Input id="daily-mileage" label="Daily Mileage Limit (km)" type="number" min="1" disabled={!termsEditing} value={termsForm.dailyMileageLimit ?? ""} onChange={(e) => handleTermsChange("dailyMileageLimit", Number(e.target.value))} error={termsErrors.dailyMileageLimit} />
                    </div>
                  )}
                  {termsForm.mileagePolicy === "total_limit" && (
                    <div className="mt-3">
                      <Input id="total-mileage" label="Total Mileage Limit (km)" type="number" min="1" disabled={!termsEditing} value={termsForm.totalMileageLimit ?? ""} onChange={(e) => handleTermsChange("totalMileageLimit", Number(e.target.value))} error={termsErrors.totalMileageLimit} />
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Rental Duration</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input id="min-days" label="Minimum Days" type="number" min="1" disabled={!termsEditing} value={termsForm.minimumRentalDays ?? 1} onChange={(e) => handleTermsChange("minimumRentalDays", Number(e.target.value))} error={termsErrors.minimumRentalDays} />
                    <Input id="max-days" label="Maximum Days" type="number" min="1" disabled={!termsEditing} value={termsForm.maximumRentalDays ?? 90} onChange={(e) => handleTermsChange("maximumRentalDays", Number(e.target.value))} error={termsErrors.maximumRentalDays} />
                  </div>
                </div>
              </div>

              <hr className="border-gray-200" />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Additional Options</h4>
                  <Input id="add-driver-fee" label="Additional Driver Fee (ETB)" type="number" min="0" disabled={!termsEditing} value={termsForm.additionalDriverFee ?? 0} onChange={(e) => handleTermsChange("additionalDriverFee", Number(e.target.value))} />
                  <div className="mt-3">
                    <Checkbox id="cross-border" label="Allow cross-border travel" checked={Boolean(termsForm.crossBorderAllowed)} disabled={!termsEditing} onChange={(e) => handleTermsChange("crossBorderAllowed", e.target.checked)} />
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Geographic Restrictions</h4>
                  {(termsForm.geographicRestrictions || []).length === 0 && (
                    <p className="text-xs text-gray-400 mb-2">No restrictions configured.</p>
                  )}
                  <ul className="space-y-1.5 mb-3">
                    {(termsForm.geographicRestrictions || []).map((r, i) => (
                      <li key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2 text-gray-700">
                        <span>{r}</span>
                        {termsEditing && (
                          <button type="button" onClick={() => removeRestriction(i)} className="text-gray-400 hover:text-red-500 ml-2">&times;</button>
                        )}
                      </li>
                    ))}
                  </ul>
                  {termsEditing && (
                    <div className="flex gap-2">
                      <Input id="new-restriction" placeholder="Add restriction..." value={newRestriction} onChange={(e) => setNewRestriction(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRestriction() } }} />
                      <Button variant="outline" size="sm" onClick={addRestriction}>Add</Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Vehicle" : "Add Vehicle"}
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>
              {editing ? "Save Changes" : "Add Vehicle"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Vehicle Details</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="make" label="Make" required placeholder="e.g. Toyota" value={form.make} onChange={(e) => handleChange("make", e.target.value)} error={errors.make} />
              <Input id="model" label="Model" required placeholder="e.g. Land Cruiser" value={form.model} onChange={(e) => handleChange("model", e.target.value)} error={errors.model} />
              <Input id="year" label="Year" type="number" min="1950" max="2030" required value={form.year} onChange={(e) => handleChange("year", e.target.value)} error={errors.year} />
              <Input id="plate-number" label="Plate Number" required placeholder="e.g. ADD-3247" value={form.plateNumber} onChange={(e) => handleChange("plateNumber", e.target.value.toUpperCase())} error={errors.plateNumber} />
              <Input id="seats" label="Seats" type="number" min="1" required value={form.seats} onChange={(e) => handleChange("seats", e.target.value)} error={errors.seats} />
              <Input id="luggage" label="Luggage Capacity" type="number" min="0" required value={form.luggageCapacity} onChange={(e) => handleChange("luggageCapacity", e.target.value)} error={errors.luggageCapacity} />
              <Select id="branch" label="Branch Location" options={BRANCH_OPTIONS.map((b) => ({ value: b, label: b }))} value={form.branchLocation} onChange={(e) => handleChange("branchLocation", e.target.value)} />
              {editing && (
                <Select id="status" label="Status" options={VEHICLE_STATUS_OPTIONS} value={form.status} onChange={(e) => handleChange("status", e.target.value)} error={errors.status} required />
              )}
            </div>
          </div>

          <hr className="border-gray-200" />

          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Specifications</h4>
            <div className="grid gap-4 sm:grid-cols-3">
              <Select id="transmission" label="Transmission" options={TRANSMISSION_TYPES} value={form.transmission} onChange={(e) => handleChange("transmission", e.target.value)} error={errors.transmission} required />
              <Select id="fuelType" label="Fuel Type" options={FUEL_TYPES} value={form.fuelType} onChange={(e) => handleChange("fuelType", e.target.value)} error={errors.fuelType} required />
              <div className="flex items-end pb-1">
                <Checkbox id="fourWheelDrive" label="4WD vehicle" checked={Boolean(form.fourWheelDrive)} onChange={(e) => handleChange("fourWheelDrive", e.target.checked)} />
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Pricing</h4>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input id="dailyPrice" label="Daily Rate (ETB)" type="number" min="0" required value={form.dailyPrice} onChange={(e) => handleChange("dailyPrice", e.target.value)} error={errors.dailyPrice} />
              <Input id="weeklyPrice" label="Weekly Rate (ETB)" type="number" min="0" value={form.weeklyPrice} onChange={(e) => handleChange("weeklyPrice", e.target.value)} error={errors.weeklyPrice} />
              <Input id="deposit" label="Deposit (ETB)" type="number" min="0" required value={form.deposit} onChange={(e) => handleChange("deposit", e.target.value)} error={errors.deposit} />
            </div>
          </div>

          <hr className="border-gray-200" />

          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Options & Insurance</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select id="driverAvailability" label="Driver Option" options={DRIVER_AVAILABILITY_OPTIONS} value={form.driverAvailability} onChange={(e) => handleChange("driverAvailability", e.target.value)} error={errors.driverAvailability} required />
              <Select id="insurance" label="Insurance Cover" options={INSURANCE_COVER_OPTIONS} value={form.insurance} onChange={(e) => handleChange("insurance", e.target.value)} error={errors.insurance} required />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Features</h4>
            <div className="grid gap-x-6 gap-y-2 sm:grid-cols-3">
              {VEHICLE_SPECIFIC_FEATURES.map((feature) => (
                <Checkbox key={feature} id={`feature-${feature}`} label={feature} checked={(form.features || []).includes(feature)} onChange={() => toggleFeature(feature)} />
              ))}
            </div>
          </div>

          <div>
            <Input id="image" label="Image URL" placeholder="Paste an image URL or leave blank for placeholder" value={form.image} onChange={(e) => handleChange("image", e.target.value)} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete vehicle"
        message={`Remove "${deleting?.make} ${deleting?.model}" from your fleet? This cannot be undone.`}
        onConfirm={handleDelete}
        confirming={Boolean(deletingId)}
      />
    </div>
  )
}
