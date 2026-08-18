import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Trash2, Save, MapPin, CalendarRange } from "lucide-react";
import Card from "../common/Card";
import Button from "../common/Button";
import Input from "../common/Input";
import Checkbox from "../common/Checkbox";
import Badge from "../common/Badge";
import { LANGUAGES_OPTIONS } from "../../constants/registrationOptions";
import { COVERAGE_AREAS } from "../../constants/inventoryOptions";
import { validateGuide } from "../../utils/inventoryValidation";
import * as inventoryService from "../../services/inventoryService";

const generateId = () => `range-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export default function GuideProfileEditor() {
  const [form, setForm] = useState({
    languages: [],
    coverage: [],
    availabilityRanges: [],
    guidingDayRate: "",
    drivingDayRate: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [coverageInput, setCoverageInput] = useState("");
  const [notice, setNotice] = useState(null);
  const noticeTimer = useRef(null);

  const showNotice = (message) => {
    setNotice(message);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3000);
  };

  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  const loadProfile = useCallback(async () => {
    const profile = await inventoryService.getGuideProfile();
    setForm({
      languages: profile.languages ?? [],
      coverage: profile.coverage ?? [],
      availabilityRanges: (profile.availabilityRanges ?? []).map((range) => ({
        id: range.id ?? generateId(),
        startDate: range.startDate ?? "",
        endDate: range.endDate ?? "",
      })),
      guidingDayRate: String(profile.guidingDayRate ?? ""),
      drivingDayRate: String(profile.drivingDayRate ?? ""),
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const toggleLanguage = (language) => {
    const current = form.languages;
    handleChange(
      "languages",
      current.includes(language) ? current.filter((item) => item !== language) : [...current, language]
    );
  };

  const addCoverage = (area) => {
    const value = area.trim();
    if (!value || form.coverage.includes(value)) return;
    handleChange("coverage", [...form.coverage, value]);
    setCoverageInput("");
  };

  const removeCoverage = (area) => {
    handleChange("coverage", form.coverage.filter((item) => item !== area));
  };

  const addRange = () => {
    handleChange("availabilityRanges", [...form.availabilityRanges, { id: generateId(), startDate: "", endDate: "" }]);
  };

  const updateRange = (id, field, value) => {
    handleChange(
      "availabilityRanges",
      form.availabilityRanges.map((range) => (range.id === id ? { ...range, [field]: value } : range))
    );
  };

  const removeRange = (id) => {
    handleChange("availabilityRanges", form.availabilityRanges.filter((range) => range.id !== id));
  };

  const handleSave = async () => {
    const validationErrors = validateGuide(form);
    if (Object.keys(validationErrors).length > 0) return setErrors(validationErrors);

    setSaving(true);
    try {
      await inventoryService.updateGuideProfile({
        languages: form.languages,
        coverage: form.coverage,
        availabilityRanges: form.availabilityRanges,
        guidingDayRate: Number(form.guidingDayRate),
        drivingDayRate: Number(form.drivingDayRate),
      });
      showNotice("Profile saved.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Card><div className="py-12 text-center text-sm text-gray-400">Loading profile…</div></Card>;
  }

  return (
    <div className="space-y-4">
      {notice && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {notice}
        </div>
      )}

      <Card>
        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Languages spoken</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {LANGUAGES_OPTIONS.map((language) => (
                <Checkbox
                  key={language}
                  id={`guide-languages-${language}`}
                  label={language}
                  checked={form.languages.includes(language)}
                  onChange={() => toggleLanguage(language)}
                />
              ))}
            </div>
            {errors.languages && <p className="mt-1 text-xs text-red-500">{errors.languages}</p>}
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">Location coverage</p>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {form.coverage.length === 0 && (
                <span className="text-xs text-gray-400">No coverage areas added yet.</span>
              )}
              {form.coverage.map((area) => (
                <Badge key={area} tone="brand">
                  {area}
                  <button
                    type="button"
                    onClick={() => removeCoverage(area)}
                    className="ml-1.5 text-brand-600 hover:text-red-600"
                    aria-label={`Remove ${area}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={coverageInput}
                placeholder="Type a city or region, e.g. Hawassa"
                onChange={(e) => setCoverageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCoverage(coverageInput);
                  }
                }}
              />
              <Button variant="outline" onClick={() => addCoverage(coverageInput)} className="shrink-0">
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {COVERAGE_AREAS.filter((area) => !form.coverage.includes(area)).map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() => addCoverage(area)}
                  className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:border-brand-500 hover:text-brand-600"
                >
                  + {area}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <CalendarRange className="h-4 w-4 text-gray-400" />
              <p className="text-sm font-medium text-gray-700">Availability dates</p>
            </div>
            <div className="space-y-2">
              {form.availabilityRanges.length === 0 && (
                <p className="text-xs text-gray-400">No availability set. Add date ranges you're free to work.</p>
              )}
              {form.availabilityRanges.map((range) => (
                <div key={range.id} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    label="From"
                    type="date"
                    value={range.startDate}
                    onChange={(e) => updateRange(range.id, "startDate", e.target.value)}
                  />
                  <Input
                    label="To"
                    type="date"
                    value={range.endDate}
                    onChange={(e) => updateRange(range.id, "endDate", e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeRange(range.id)}
                    className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove availability range"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {errors.availabilityRanges && (
                <p className="text-xs text-red-500">{errors.availabilityRanges}</p>
              )}
            </div>
            <Button variant="outline" size="sm" className="mt-3" onClick={addRange}>
              <Plus className="h-4 w-4" /> Add availability range
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="guidingDayRate"
              label="Guiding day rate (ETB)"
              type="number"
              min="0"
              value={form.guidingDayRate}
              error={errors.guidingDayRate}
              onChange={(e) => handleChange("guidingDayRate", e.target.value)}
            />
            <Input
              id="drivingDayRate"
              label="Driving day rate (ETB)"
              type="number"
              min="0"
              value={form.drivingDayRate}
              error={errors.drivingDayRate}
              onChange={(e) => handleChange("drivingDayRate", e.target.value)}
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving}>
          <Save className="h-4 w-4" /> Save Profile
        </Button>
      </div>
    </div>
  );
}
