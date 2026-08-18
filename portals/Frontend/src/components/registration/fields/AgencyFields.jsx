import Input from "../../common/Input";
import Select from "../../common/Select";
import Textarea from "../../common/Textarea";
import Checkbox from "../../common/Checkbox";
import {
  AGENCY_TYPES,
  TOUR_TYPES,
  CURRENCIES,
  PAYMENT_METHODS,
  TOUR_SPECIALTIES,
} from "../../../constants/registrationOptions";

export default function AgencyFields({ data, errors, onChange }) {
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
          id="agencyName"
          label="Agency name"
          value={data.agencyName ?? ""}
          error={errors.agencyName}
          onChange={(e) => onChange("agencyName", e.target.value)}
          required
        />
        <Input
          id="businessRegistration"
          label="Business registration number"
          value={data.businessRegistration ?? ""}
          error={errors.businessRegistration}
          onChange={(e) => onChange("businessRegistration", e.target.value)}
          required
        />
        <Select
          id="agencyType"
          label="Agency type"
          options={AGENCY_TYPES}
          value={data.agencyType ?? ""}
          onChange={(e) => onChange("agencyType", e.target.value)}
        />
        <Input
          id="yearEstablished"
          label="Year established"
          type="number"
          min="1900"
          max="2026"
          value={data.yearEstablished ?? ""}
          onChange={(e) => onChange("yearEstablished", e.target.value)}
        />
        <Select
          id="currency"
          label="Default currency"
          options={CURRENCIES}
          value={data.currency ?? ""}
          onChange={(e) => onChange("currency", e.target.value)}
        />
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Specialties</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {TOUR_SPECIALTIES.map((specialty) => (
            <Checkbox
              key={specialty}
              id={`specialties-${specialty}`}
              label={specialty}
              checked={(data.specialties ?? []).includes(specialty)}
              onChange={() => toggleArrayValue("specialties", specialty)}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Tour types offered</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {TOUR_TYPES.map((option) => (
            <Checkbox
              key={option.value}
              id={`tourTypes-${option.value}`}
              label={option.label}
              checked={(data.tourTypes ?? []).includes(option.value)}
              onChange={() => toggleArrayValue("tourTypes", option.value)}
            />
          ))}
        </div>
      </div>

      <Textarea
        id="description"
        label="Business description"
        placeholder="Describe your agency and the tours you offer…"
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
