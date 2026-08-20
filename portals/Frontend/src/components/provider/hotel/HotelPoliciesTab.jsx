import Input from "../../common/Input"
import Select from "../../common/Select"
import Textarea from "../../common/Textarea"
import { CANCELLATION_POLICIES, PET_POLICIES, SMOKING_POLICIES } from "../../../constants/hotelProfileOptions"

export default function HotelPoliciesTab({ data, errors, onChange, isEditing }) {
  const handle = (field) => (e) => onChange(field, e.target.value)

  if (!isEditing) {
    return (
      <div className="space-y-5">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            ["Check-in Time", data.checkInTime],
            ["Check-out Time", data.checkOutTime],
            [
              "Cancellation Policy",
              CANCELLATION_POLICIES.find((p) => p.value === data.cancellationPolicy)?.label || data.cancellationPolicy,
            ],
            [
              "Pet Policy",
              PET_POLICIES.find((p) => p.value === data.petPolicy)?.label || data.petPolicy,
            ],
            [
              "Smoking Policy",
              SMOKING_POLICIES.find((p) => p.value === data.smokingPolicy)?.label || data.smokingPolicy,
            ],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-gray-400 uppercase tracking-wide">{label}</dt>
              <dd className="text-sm text-gray-800 mt-0.5">{value || "—"}</dd>
            </div>
          ))}
        </dl>
        {data.policies && (
          <div>
            <dt className="text-xs text-gray-400 uppercase tracking-wide mb-1">Additional Notes</dt>
            <dd className="text-sm text-gray-700 whitespace-pre-wrap">{data.policies}</dd>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Input
        id="hotel-checkin"
        label="Check-in Time"
        required
        type="time"
        value={data.checkInTime || ""}
        onChange={handle("checkInTime")}
        error={errors.checkInTime}
      />
      <Input
        id="hotel-checkout"
        label="Check-out Time"
        required
        type="time"
        value={data.checkOutTime || ""}
        onChange={handle("checkOutTime")}
        error={errors.checkOutTime}
      />
      <Select
        id="hotel-cancellation"
        label="Cancellation Policy"
        options={CANCELLATION_POLICIES}
        value={data.cancellationPolicy || ""}
        onChange={handle("cancellationPolicy")}
      />
      <Select
        id="hotel-pet"
        label="Pet Policy"
        options={PET_POLICIES}
        value={data.petPolicy || ""}
        onChange={handle("petPolicy")}
      />
      <Select
        id="hotel-smoking"
        label="Smoking Policy"
        options={SMOKING_POLICIES}
        value={data.smokingPolicy || ""}
        onChange={handle("smokingPolicy")}
      />
      <div className="sm:col-span-2">
        <Textarea
          id="hotel-policies"
          label="Additional Notes"
          rows={3}
          placeholder="Any other policies or house rules..."
          value={data.policies || ""}
          onChange={handle("policies")}
        />
      </div>
    </div>
  )
}
