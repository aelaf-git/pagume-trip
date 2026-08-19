import Input from "../../common/Input";
import Select from "../../common/Select";
import Textarea from "../../common/Textarea";
import Checkbox from "../../common/Checkbox";
import {
  BUSINESS_TYPES,
  STAR_RATINGS,
  ROOM_TYPES,
  CURRENCIES,
  PAYMENT_METHODS,
  AMENITIES_OPTIONS,
} from "../../../constants/registrationOptions";

export default function HotelFields({ data, errors, onChange }) {
  const toggleArrayValue = (field, value) => {
    const current = data[field] ?? [];
    onChange(
      field,
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="name"
          label="Hotel / Property name"
          value={data.name ?? ""}
          error={errors.name}
          onChange={(e) => onChange("name", e.target.value)}
          required
        />
        <Select
          id="businessType"
          label="Business type"
          options={BUSINESS_TYPES}
          value={data.businessType ?? ""}
          onChange={(e) => onChange("businessType", e.target.value)}
        />
        <Input
          id="address"
          label="Address"
          value={data.address ?? ""}
          error={errors.address}
          onChange={(e) => onChange("address", e.target.value)}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="latitude"
            label="Latitude"
            type="number"
            step="any"
            value={data.latitude ?? ""}
            error={errors.latitude}
            onChange={(e) => onChange("latitude", e.target.value)}
            required
          />
          <Input
            id="longitude"
            label="Longitude"
            type="number"
            step="any"
            value={data.longitude ?? ""}
            error={errors.longitude}
            onChange={(e) => onChange("longitude", e.target.value)}
            required
          />
        </div>
        <Input
          id="contact"
          label="Contact phone"
          type="tel"
          value={data.contact ?? ""}
          error={errors.contact}
          onChange={(e) => onChange("contact", e.target.value)}
          required
        />
        <Select
          id="starRating"
          label="Star rating"
          options={STAR_RATINGS}
          value={data.starRating ?? ""}
          onChange={(e) => onChange("starRating", e.target.value)}
        />
        <Input
          id="checkInTime"
          label="Check-in time"
          type="time"
          value={data.checkInTime ?? ""}
          error={errors.checkInTime}
          onChange={(e) => onChange("checkInTime", e.target.value)}
          required
        />
        <Input
          id="checkOutTime"
          label="Check-out time"
          type="time"
          value={data.checkOutTime ?? ""}
          error={errors.checkOutTime}
          onChange={(e) => onChange("checkOutTime", e.target.value)}
          required
        />
        <Select
          id="currency"
          label="Default currency"
          options={CURRENCIES}
          value={data.currency ?? ""}
          onChange={(e) => onChange("currency", e.target.value)}
        />
      </div>

      <Textarea
        id="description"
        label="Description"
        placeholder="Describe your hotel or resort…"
        value={data.description ?? ""}
        error={errors.description}
        onChange={(e) => onChange("description", e.target.value)}
        required
      />

      <Textarea
        id="policies"
        label="Policies"
        placeholder="Cancellation, check-in, pet policy, etc…"
        value={data.policies ?? ""}
        error={errors.policies}
        onChange={(e) => onChange("policies", e.target.value)}
        required
      />

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Room types</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {ROOM_TYPES.map((option) => (
            <Checkbox
              key={option.value}
              id={`roomTypes-${option.value}`}
              label={option.label}
              checked={(data.roomTypes ?? []).includes(option.value)}
              onChange={() => toggleArrayValue("roomTypes", option.value)}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Amenities</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {AMENITIES_OPTIONS.map((amenity) => (
            <Checkbox
              key={amenity}
              id={`amenities-${amenity}`}
              label={amenity}
              checked={(data.amenities ?? []).includes(amenity)}
              onChange={() => toggleArrayValue("amenities", amenity)}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Accepted payment methods</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {PAYMENT_METHODS.map((option) => (
            <Checkbox
              key={option.value}
              id={`paymentMethods-${option.value}`}
              label={option.label}
              checked={(data.paymentMethods ?? []).includes(option.value)}
              onChange={() => toggleArrayValue("paymentMethods", option.value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
