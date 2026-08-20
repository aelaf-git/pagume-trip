import Input from "../../common/Input"
import Select from "../../common/Select"
import Textarea from "../../common/Textarea"
import { BUSINESS_TYPES, STAR_RATINGS, CURRENCIES } from "../../../constants/registrationOptions"

export default function HotelGeneralInfoTab({ data, errors, onChange, isEditing }) {
  const handle = (field) => (e) => onChange(field, e.target.value)

  if (!isEditing) {
    return (
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          ["Hotel Name", data.name],
          ["Business Type", BUSINESS_TYPES.find((b) => b.value === data.businessType)?.label || data.businessType],
          ["Description", data.description],
          ["Address", data.address],
          ["Latitude", data.latitude],
          ["Longitude", data.longitude],
          ["Contact Phone", data.contact],
          ["Star Rating", STAR_RATINGS.find((s) => s.value === data.starRating)?.label || data.starRating],
          ["Currency", CURRENCIES.find((c) => c.value === data.currency)?.label || data.currency],
        ].map(([label, value]) => (
          <div key={label} className={label === "Description" ? "sm:col-span-2" : ""}>
            <dt className="text-xs text-gray-400 uppercase tracking-wide">{label}</dt>
            <dd className="text-sm text-gray-800 mt-0.5">{value || "—"}</dd>
          </div>
        ))}
      </dl>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <Input
          id="hotel-name"
          label="Hotel Name"
          required
          value={data.name || ""}
          onChange={handle("name")}
          error={errors.name}
        />
      </div>
      <Select
        id="hotel-business-type"
        label="Business Type"
        options={BUSINESS_TYPES}
        value={data.businessType || ""}
        onChange={handle("businessType")}
      />
      <Select
        id="hotel-star-rating"
        label="Star Rating"
        options={STAR_RATINGS}
        value={data.starRating || ""}
        onChange={handle("starRating")}
      />
      <div className="sm:col-span-2">
        <Textarea
          id="hotel-description"
          label="Description"
          required
          rows={3}
          value={data.description || ""}
          onChange={handle("description")}
          error={errors.description}
        />
      </div>
      <div className="sm:col-span-2">
        <Input
          id="hotel-address"
          label="Address"
          required
          value={data.address || ""}
          onChange={handle("address")}
          error={errors.address}
        />
      </div>
      <Input
        id="hotel-latitude"
        label="Latitude"
        required
        type="number"
        step="any"
        min="-90"
        max="90"
        value={data.latitude || ""}
        onChange={handle("latitude")}
        error={errors.latitude}
      />
      <Input
        id="hotel-longitude"
        label="Longitude"
        required
        type="number"
        step="any"
        min="-180"
        max="180"
        value={data.longitude || ""}
        onChange={handle("longitude")}
        error={errors.longitude}
      />
      <Input
        id="hotel-contact"
        label="Contact Phone"
        required
        type="tel"
        placeholder="+251911223344"
        value={data.contact || ""}
        onChange={handle("contact")}
        error={errors.contact}
      />
      <Select
        id="hotel-currency"
        label="Currency"
        options={CURRENCIES}
        value={data.currency || ""}
        onChange={handle("currency")}
      />
    </div>
  )
}
