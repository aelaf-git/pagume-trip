import { useState, useEffect } from "react"
import Modal from "../common/Modal"
import Input from "../common/Input"
import Select from "../common/Select"
import Textarea from "../common/Textarea"
import Button from "../common/Button"
import { DESTINATION_CATEGORIES, DESTINATION_REGIONS } from "../../constants/destinationOptions"

const EMPTY_FORM = {
  name: "",
  description: "",
  region: "",
  zone: "",
  woreda: "",
  latitude: "",
  longitude: "",
  category: "",
  historicalInfo: "",
  accessibility: "",
  seasonalInfo: "",
}

function validate(form) {
  const errors = {}
  if (!form.name.trim()) errors.name = "Name is required"
  if (!form.region) errors.region = "Region is required"
  if (!form.category) errors.category = "Category is required"
  return errors
}

export default function DestinationFormModal({ open, destination, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (destination) {
      setForm({
        name: destination.name || "",
        description: destination.description || "",
        region: destination.region || "",
        zone: destination.zone || "",
        woreda: destination.woreda || "",
        latitude: destination.latitude || "",
        longitude: destination.longitude || "",
        category: destination.category || "",
        historicalInfo: destination.historicalInfo || "",
        accessibility: destination.accessibility || "",
        seasonalInfo: destination.seasonalInfo || "",
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setErrors({})
    setSaving(false)
  }, [destination, open])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const handleSave = async () => {
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setSaving(true)
    await onSave(destination?.id || null, form)
    setSaving(false)
  }

  const isEditing = Boolean(destination)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Destination" : "Add Destination"}
      size="xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button loading={saving} onClick={handleSave}>
            {isEditing ? "Save Changes" : "Create Destination"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="dest-name"
            label="Name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            error={errors.name}
            required
          />
          <Select
            id="dest-category"
            label="Category"
            options={DESTINATION_CATEGORIES}
            value={form.category}
            onChange={(e) => handleChange("category", e.target.value)}
            error={errors.category}
            required
          />
        </div>

        <Textarea
          id="dest-description"
          label="Description"
          rows={3}
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="A brief description of the destination..."
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            id="dest-region"
            label="Region"
            options={DESTINATION_REGIONS}
            value={form.region}
            onChange={(e) => handleChange("region", e.target.value)}
            error={errors.region}
            required
          />
          <Input
            id="dest-zone"
            label="Zone"
            value={form.zone}
            onChange={(e) => handleChange("zone", e.target.value)}
          />
          <Input
            id="dest-woreda"
            label="Woreda"
            value={form.woreda}
            onChange={(e) => handleChange("woreda", e.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="dest-lat"
            label="Latitude"
            type="number"
            step="any"
            value={form.latitude}
            onChange={(e) => handleChange("latitude", e.target.value)}
          />
          <Input
            id="dest-lon"
            label="Longitude"
            type="number"
            step="any"
            value={form.longitude}
            onChange={(e) => handleChange("longitude", e.target.value)}
          />
        </div>

        <Textarea
          id="dest-historical"
          label="Historical Information"
          rows={3}
          value={form.historicalInfo}
          onChange={(e) => handleChange("historicalInfo", e.target.value)}
          placeholder="Historical background and significance..."
        />

        <Textarea
          id="dest-accessibility"
          label="Accessibility"
          rows={3}
          value={form.accessibility}
          onChange={(e) => handleChange("accessibility", e.target.value)}
          placeholder="How to get there, transportation options..."
        />

        <Textarea
          id="dest-seasonal"
          label="Seasonal Advice"
          rows={3}
          value={form.seasonalInfo}
          onChange={(e) => handleChange("seasonalInfo", e.target.value)}
          placeholder="Best times to visit, weather considerations..."
        />
      </div>
    </Modal>
  )
}
