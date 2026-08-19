import Checkbox from "../../common/Checkbox"
import { ROOM_TYPES, PAYMENT_METHODS } from "../../../constants/registrationOptions"
import { EXTENDED_AMENITIES } from "../../../constants/hotelProfileOptions"

function toggleArrayValue(arr = [], value) {
  const set = new Set(arr)
  if (set.has(value)) {
    set.delete(value)
  } else {
    set.add(value)
  }
  return Array.from(set)
}

function CheckboxGroup({ title, options, selected = [], field, isEditing, onChange }) {
  const isObjectArray = typeof options[0] === "object"

  if (!isEditing) {
    const labels = selected
      .map((v) => (isObjectArray ? options.find((o) => o.value === v)?.label || v : v))
      .filter(Boolean)
    return (
      <div>
        <h4 className="text-xs text-gray-400 uppercase tracking-wide mb-2">{title}</h4>
        {labels.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {labels.map((l) => (
              <span key={l} className="inline-block bg-brand-50 text-brand-700 text-xs font-medium px-2.5 py-1 rounded-full">
                {l}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">None selected</p>
        )}
      </div>
    )
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map((opt) => {
          const value = isObjectArray ? opt.value : opt
          const label = isObjectArray ? opt.label : opt
          return (
            <Checkbox
              key={value}
              label={label}
              checked={(selected || []).includes(value)}
              onChange={() => onChange(field, toggleArrayValue(selected, value))}
            />
          )
        })}
      </div>
    </div>
  )
}

export default function HotelAmenitiesTab({ data, isEditing, onChange }) {
  return (
    <div className="space-y-6">
      <CheckboxGroup
        title="Room Types"
        options={ROOM_TYPES}
        selected={data.roomTypes}
        field="roomTypes"
        isEditing={isEditing}
        onChange={onChange}
      />
      <CheckboxGroup
        title="Amenities"
        options={EXTENDED_AMENITIES}
        selected={data.amenities}
        field="amenities"
        isEditing={isEditing}
        onChange={onChange}
      />
      <CheckboxGroup
        title="Payment Methods"
        options={PAYMENT_METHODS}
        selected={data.paymentMethods}
        field="paymentMethods"
        isEditing={isEditing}
        onChange={onChange}
      />
    </div>
  )
}
