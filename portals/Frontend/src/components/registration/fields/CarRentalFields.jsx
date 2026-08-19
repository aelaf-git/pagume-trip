import { useState } from "react";
import Input from "../../common/Input";
import Select from "../../common/Select";
import Textarea from "../../common/Textarea";
import Checkbox from "../../common/Checkbox";
import Button from "../../common/Button";
import { Plus, X } from "lucide-react";
import {
  VEHICLE_TYPES,
  TRANSMISSION_TYPES,
  CURRENCIES,
  PAYMENT_METHODS,
  FLEET_SIZE_RANGES,
} from "../../../constants/registrationOptions";

function LocationListInput({ label, value, onChange, error }) {
  const [input, setInput] = useState("");
  const locations = value ?? [];

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onChange([...locations, trimmed]);
    setInput("");
  };

  const handleRemove = (index) => {
    onChange(locations.filter((_, i) => i !== index));
  };

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
      <div className="flex items-center gap-2">
        <Input
          value={input}
          placeholder="Type a location and press Add"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={handleAdd}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
      {locations.length > 0 && (
        <ul className="mt-3 space-y-2">
          {locations.map((location, index) => (
            <li
              key={`${location}-${index}`}
              className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
            >
              <span>{location}</span>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="text-gray-400 hover:text-red-500"
                aria-label={`Remove ${location}`}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function CarRentalFields({ data, errors, onChange }) {
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
          id="companyName"
          label="Company name"
          value={data.companyName ?? ""}
          error={errors.companyName}
          onChange={(e) => onChange("companyName", e.target.value)}
          required
        />
        <Select
          id="fleetSize"
          label="Fleet size"
          options={FLEET_SIZE_RANGES}
          value={data.fleetSize ?? ""}
          error={errors.fleetSize}
          onChange={(e) => onChange("fleetSize", e.target.value)}
          required
        />
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Vehicle types</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {VEHICLE_TYPES.map((option) => (
            <Checkbox
              key={option.value}
              id={`vehicleTypes-${option.value}`}
              label={option.label}
              checked={(data.vehicleTypes ?? []).includes(option.value)}
              onChange={() => toggleArrayValue("vehicleTypes", option.value)}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          id="transmission"
          label="Transmission"
          options={TRANSMISSION_TYPES}
          value={data.transmission ?? ""}
          onChange={(e) => onChange("transmission", e.target.value)}
        />
        <Select
          id="currency"
          label="Default currency"
          options={CURRENCIES}
          value={data.currency ?? ""}
          onChange={(e) => onChange("currency", e.target.value)}
        />
      </div>

      <LocationListInput
        label="Pickup locations"
        value={data.pickupLocations}
        onChange={(locations) => onChange("pickupLocations", locations)}
        error={errors.pickupLocations}
      />

      <LocationListInput
        label="Drop-off locations"
        value={data.dropoffLocations}
        onChange={(locations) => onChange("dropoffLocations", locations)}
        error={errors.dropoffLocations}
      />

      <Textarea
        id="description"
        label="Business description"
        placeholder="Describe your fleet and rental terms…"
        value={data.description ?? ""}
        onChange={(e) => onChange("description", e.target.value)}
      />

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
