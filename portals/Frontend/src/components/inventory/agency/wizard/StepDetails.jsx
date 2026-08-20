import { PlusCircle, Trash2 } from "lucide-react"
import Input from "../../../common/Input"
import Textarea from "../../../common/Textarea"
import { DESTINATIONS, DIFFICULTY_LEVELS } from "../../../../constants/inventoryOptions"

export default function StepDetails({ data, errors, onChange }) {
  const handle = (field) => (e) => onChange(field, e.target.value)

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input id="pkg-name" label="Package Name" required value={data.name || ""} onChange={handle("name")} error={errors?.name} />
        <Input id="pkg-dest" label="Destination" list="destinations" required value={data.destination || ""} onChange={handle("destination")} error={errors?.destination} />
        <datalist id="destinations">
          {DESTINATIONS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </datalist>
      </div>

      <Textarea id="pkg-desc" label="Description" rows={3} placeholder="Describe the highlights of this tour..." value={data.description || ""} onChange={handle("description")} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Input id="pkg-duration" label="Duration (days)" type="number" min="1" required value={data.durationDays || ""} onChange={handle("durationDays")} error={errors?.durationDays} />
        <div>
          <label htmlFor="pkg-difficulty" className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
          <select id="pkg-difficulty" value={data.difficulty || ""} onChange={handle("difficulty")}
            className="block w-full rounded-lg border px-3 py-2 text-sm border-gray-300 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 outline-none">
            <option value="">Select...</option>
            {DIFFICULTY_LEVELS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
          {errors?.difficulty && <p className="mt-1 text-xs text-red-500">{errors.difficulty}</p>}
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-sm font-medium text-gray-700">Departure Dates</p>
          {errors?.departureDates && <p className="text-xs text-red-500">{errors.departureDates}</p>}
        </div>
        {(data.departureDates || []).length === 0 && <p className="text-xs text-gray-400 mb-2">No departure dates added.</p>}
        <div className="flex flex-wrap gap-2 mb-2">
          {(data.departureDates || []).map((date, i) => (
            <span key={i} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs rounded-full px-2.5 py-1">
              {date}
              <button type="button" onClick={() => {
                const next = (data.departureDates || []).filter((_, j) => j !== i)
                onChange("departureDates", next)
              }} className="text-gray-400 hover:text-red-500 ml-0.5">&times;</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="date" id="new-departure-date"
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 outline-none" />
          <button type="button" onClick={() => {
            const input = document.getElementById("new-departure-date")
            if (input && input.value) {
              onChange("departureDates", [...(data.departureDates || []), input.value])
              input.value = ""
            }
          }} className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
            <PlusCircle className="h-4 w-4" /> Add date
          </button>
        </div>
      </div>

      <Textarea id="pkg-cancellation" label="Cancellation Policy" rows={2} placeholder="e.g. Free cancellation up to 14 days before departure..." value={data.cancellationPolicy || ""} onChange={handle("cancellationPolicy")} error={errors?.cancellationPolicy} required />
    </div>
  )
}
