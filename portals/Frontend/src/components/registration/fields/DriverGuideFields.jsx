import Input from "../../common/Input";
import Select from "../../common/Select";
import Textarea from "../../common/Textarea";
import Checkbox from "../../common/Checkbox";
import {
  LANGUAGES_OPTIONS,
  EXPERIENCE_LEVELS,
} from "../../../constants/registrationOptions";

export default function DriverGuideFields({ data, errors, onChange }) {
  const toggleLanguage = (language) => {
    const current = data.languages ?? [];
    onChange(
      "languages",
      current.includes(language) ? current.filter((item) => item !== language) : [...current, language]
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id="fullName"
          label="Full name"
          value={data.fullName ?? ""}
          error={errors.fullName}
          onChange={(e) => onChange("fullName", e.target.value)}
          required
        />
        <Input
          id="email"
          label="Login email"
          type="email"
          value={data.email ?? ""}
          onChange={(e) => onChange("email", e.target.value)}
          required
        />
        <Input
          id="password"
          label="Login password (min 8 chars)"
          type="password"
          value={data.password ?? ""}
          onChange={(e) => onChange("password", e.target.value)}
          required
        />
        <Input
          id="licenseNumber"
          label="Professional license number"
          value={data.licenseNumber ?? ""}
          error={errors.licenseNumber}
          onChange={(e) => onChange("licenseNumber", e.target.value)}
          required
        />
        <Input
          id="licenseExpiry"
          label="License expiry date"
          type="date"
          value={data.licenseExpiry ?? ""}
          error={errors.licenseExpiry}
          onChange={(e) => onChange("licenseExpiry", e.target.value)}
          required
        />
        <Select
          id="experienceLevel"
          label="Experience level"
          options={EXPERIENCE_LEVELS}
          value={data.experienceLevel ?? ""}
          error={errors.experienceLevel}
          onChange={(e) => onChange("experienceLevel", e.target.value)}
          required
        />
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Languages spoken</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {LANGUAGES_OPTIONS.map((language) => (
            <Checkbox
              key={language}
              id={`languages-${language}`}
              label={language}
              checked={(data.languages ?? []).includes(language)}
              onChange={() => toggleLanguage(language)}
            />
          ))}
        </div>
      </div>

      <Checkbox
        id="vehicleAvailable"
        label="I have a vehicle available"
        description="You can offer both guiding and transportation services."
        checked={Boolean(data.vehicleAvailable)}
        onChange={(e) => onChange("vehicleAvailable", e.target.checked)}
      />

      <Textarea
        id="bio"
        label="Bio"
        placeholder="Introduce yourself and your experience…"
        value={data.bio ?? ""}
        onChange={(e) => onChange("bio", e.target.value)}
      />
    </div>
  );
}
