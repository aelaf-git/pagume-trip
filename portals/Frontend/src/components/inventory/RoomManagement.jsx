import { useCallback, useEffect, useRef, useState } from "react"
import { Plus, Pencil, Trash2, BedDouble } from "lucide-react"
import Card from "../common/Card"
import Button from "../common/Button"
import Input from "../common/Input"
import Select from "../common/Select"
import Textarea from "../common/Textarea"
import Checkbox from "../common/Checkbox"
import Modal from "../common/Modal"
import Badge from "../common/Badge"
import ConfirmDialog from "../common/ConfirmDialog"
import HotelAvailabilityGrid from "./HotelAvailabilityGrid"
import { ROOM_TYPES } from "../../constants/registrationOptions"
import {
  ROOM_AVAILABILITY_OPTIONS,
  BED_CONFIGURATION_OPTIONS,
  CURRENCY_OPTIONS,
  ROOM_SPECIFIC_AMENITIES,
} from "../../constants/inventoryOptions"
import { validateRoom } from "../../utils/inventoryValidation"
import * as inventoryService from "../../services/inventoryService"

const EMPTY_FORM = {
  name: "",
  roomType: "",
  description: "",
  adultCapacity: "",
  childCapacity: "",
  beds: "",
  bedConfiguration: "",
  basePrice: "",
  currency: "ETB",
  extraPersonCharge: "",
  amenities: [],
  availability: "available",
}

export default function RoomManagement() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("rooms")

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [notice, setNotice] = useState(null)
  const noticeTimer = useRef(null)

  const [calendarData, setCalendarData] = useState([])
  const [calendarLoading, setCalendarLoading] = useState(true)

  const showNotice = (message) => {
    setNotice(message)
    clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNotice(null), 3000)
  }

  useEffect(() => () => clearTimeout(noticeTimer.current), [])

  const loadRooms = useCallback(async () => {
    const data = await inventoryService.getRooms()
    setRooms(data)
    setLoading(false)
  }, [])

  const loadCalendar = useCallback(async () => {
    const data = await inventoryService.getRoomCalendar()
    setCalendarData(data)
    setCalendarLoading(false)
  }, [])

  useEffect(() => {
    loadRooms()
    loadCalendar()
  }, [loadRooms, loadCalendar])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModalOpen(true)
  }

  const openEdit = (room) => {
    setEditing(room)
    setForm({
      name: room.name || "",
      roomType: room.roomType || "",
      description: room.description || "",
      adultCapacity: String(room.adultCapacity ?? ""),
      childCapacity: String(room.childCapacity ?? ""),
      beds: String(room.beds ?? ""),
      bedConfiguration: room.bedConfiguration || "",
      basePrice: String(room.basePrice ?? ""),
      currency: room.currency || "ETB",
      extraPersonCharge: String(room.extraPersonCharge ?? ""),
      amenities: room.amenities ?? [],
      availability: room.availability ? "available" : "unavailable",
    })
    setErrors({})
    setModalOpen(true)
  }

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const toggleAmenity = (amenity) => {
    const current = form.amenities ?? []
    handleChange(
      "amenities",
      current.includes(amenity)
        ? current.filter((a) => a !== amenity)
        : [...current, amenity]
    )
  }

  const handleSave = async () => {
    const validationErrors = validateRoom(form)
    if (Object.keys(validationErrors).length > 0) return setErrors(validationErrors)

    setSaving(true)
    const payload = {
      name: form.name,
      roomType: form.roomType,
      description: form.description,
      adultCapacity: Number(form.adultCapacity),
      childCapacity: Number(form.childCapacity) || 0,
      beds: Number(form.beds),
      bedConfiguration: form.bedConfiguration,
      amenities: form.amenities,
      basePrice: Number(form.basePrice),
      currency: form.currency,
      extraPersonCharge: Number(form.extraPersonCharge) || 0,
      availability: form.availability === "available",
    }

    try {
      if (editing) {
        await inventoryService.updateRoom(editing.id, payload)
        showNotice("Room updated.")
      } else {
        await inventoryService.createRoom(payload)
        showNotice("Room added.")
      }
      setModalOpen(false)
      await loadRooms()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeletingId(deleting.id)
    try {
      await inventoryService.deleteRoom(deleting.id)
      showNotice("Room deleted.")
      setDeleting(null)
      await loadRooms()
    } finally {
      setDeletingId(null)
    }
  }

  const handleToggleDate = async (roomId, date) => {
    await inventoryService.toggleRoomDate(roomId, date)
    setCalendarData((prev) =>
      prev.map((entry) => {
        if (entry.id !== roomId || !entry.dates) return entry
        const current = entry.dates[date]
        const next = current === "available" ? "blocked" : current === "blocked" ? "available" : current
        return { ...entry, dates: { ...entry.dates, [date]: next } }
      })
    )
    showNotice("Date availability updated.")
  }

  const handleBulkAdjust = async (roomIds, startDate, endDate, adjustment) => {
    const results = await inventoryService.bulkAdjustPrices(roomIds, startDate, endDate, adjustment)
    setCalendarData((prev) =>
      prev.map((entry) => {
        const updated = results.find((r) => r.id === entry.id)
        return updated || entry
      })
    )
  }

  return (
    <div className="space-y-4">
      {notice && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {notice}
        </div>
      )}

      <div className="border-b border-gray-200">
        <nav className="flex gap-0 -mb-px" aria-label="Room inventory tabs">
          {[
            { key: "rooms", label: "Rooms" },
            { key: "availability", label: "Availability" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-brand-500 text-brand-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === "rooms" ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {rooms.length} room{rooms.length === 1 ? "" : "s"} in your inventory
            </p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add Room
            </Button>
          </div>

          <Card>
            {loading ? (
              <div className="flex items-center justify-center py-12 text-sm text-gray-400">
                Loading rooms...
              </div>
            ) : rooms.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-center">
                <BedDouble className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No rooms yet. Add your first room to start selling.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Capacity</th>
                      <th className="px-4 py-3 font-medium">Beds / Config</th>
                      <th className="px-4 py-3 font-medium">Price / night</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((room) => (
                      <tr key={room.id} className="border-b border-gray-100 last:border-0">
                        <td className="px-4 py-3 font-medium text-gray-900">{room.name}</td>
                        <td className="px-4 py-3 text-gray-700">
                          {ROOM_TYPES.find((t) => t.value === room.roomType)?.label ?? room.roomType}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {room.adultCapacity}+{room.childCapacity}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {room.beds} bed{room.beds === 1 ? "" : "s"}
                          {room.bedConfiguration ? ` · ${room.bedConfiguration}` : ""}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-900 font-medium">
                            {room.currency === "USD" ? "$" : "ETB"} {(room.basePrice ?? 0).toLocaleString()}
                          </span>
                          {room.extraPersonCharge > 0 && (
                            <span className="block text-xs text-gray-400">
                              +{room.currency === "USD" ? "$" : "ETB"} {room.extraPersonCharge.toLocaleString()}/extra
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={room.availability ? "green" : "red"}>
                            {room.availability ? "Available" : "Unavailable"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(room)}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600"
                              aria-label={`Edit ${room.name}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleting(room)}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                              aria-label={`Delete ${room.name}`}
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
            )}
          </Card>
        </>
      ) : (
        <HotelAvailabilityGrid
          calendarData={calendarData}
          loading={calendarLoading}
          onToggle={handleToggleDate}
          onBulkAdjust={handleBulkAdjust}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Room" : "Add Room"}
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editing ? "Save Changes" : "Add Room"}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Room Details</h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input
                  id="room-name"
                  label="Room Name"
                  required
                  placeholder="e.g. Deluxe King Suite"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  error={errors.name}
                />
              </div>
              <Select
                id="room-type"
                label="Room Type"
                options={ROOM_TYPES}
                value={form.roomType}
                onChange={(e) => handleChange("roomType", e.target.value)}
                error={errors.roomType}
                required
              />
              <Select
                id="room-bed-config"
                label="Bed Configuration"
                options={BED_CONFIGURATION_OPTIONS}
                value={form.bedConfiguration}
                onChange={(e) => handleChange("bedConfiguration", e.target.value)}
                error={errors.bedConfiguration}
                required
              />
              <Input
                id="room-adults"
                label="Adult Capacity"
                type="number"
                min="1"
                required
                value={form.adultCapacity}
                onChange={(e) => handleChange("adultCapacity", e.target.value)}
                error={errors.adultCapacity}
              />
              <Input
                id="room-children"
                label="Child Capacity"
                type="number"
                min="0"
                value={form.childCapacity}
                onChange={(e) => handleChange("childCapacity", e.target.value)}
                error={errors.childCapacity}
              />
              <Input
                id="room-beds"
                label="Number of Beds"
                type="number"
                min="1"
                required
                value={form.beds}
                onChange={(e) => handleChange("beds", e.target.value)}
                error={errors.beds}
              />
              <Select
                id="room-availability"
                label="Availability"
                options={ROOM_AVAILABILITY_OPTIONS}
                value={form.availability}
                onChange={(e) => handleChange("availability", e.target.value)}
              />
              <div className="sm:col-span-2">
                <Textarea
                  id="room-description"
                  label="Description"
                  required
                  rows={3}
                  placeholder="Describe the room, its views, and what guests can expect..."
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  error={errors.description}
                />
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Pricing</h4>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                id="room-base-price"
                label="Base Price per Night"
                type="number"
                min="0"
                required
                value={form.basePrice}
                onChange={(e) => handleChange("basePrice", e.target.value)}
                error={errors.basePrice}
              />
              <Select
                id="room-currency"
                label="Currency"
                options={CURRENCY_OPTIONS}
                value={form.currency}
                onChange={(e) => handleChange("currency", e.target.value)}
              />
              <Input
                id="room-extra-charge"
                label="Extra Person Charge"
                type="number"
                min="0"
                value={form.extraPersonCharge}
                onChange={(e) => handleChange("extraPersonCharge", e.target.value)}
                error={errors.extraPersonCharge}
              />
            </div>
          </div>

          <hr className="border-gray-200" />

          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Room Amenities</h4>
            <div className="grid gap-x-6 gap-y-2 sm:grid-cols-3">
              {ROOM_SPECIFIC_AMENITIES.map((amenity) => (
                <Checkbox
                  key={amenity}
                  id={`room-amenity-${amenity}`}
                  label={amenity}
                  checked={(form.amenities ?? []).includes(amenity)}
                  onChange={() => toggleAmenity(amenity)}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete room"
        message={`Delete "${deleting?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        confirming={Boolean(deletingId)}
      />
    </div>
  )
}
