import { PlusCircle, Trash2, GripVertical } from "lucide-react"
import Input from "../../../common/Input"
import Textarea from "../../../common/Textarea"

export default function StepItinerary({ data, errors, onChange }) {
  const days = data.itinerary || []

  const updateDay = (index, field, value) => {
    const next = days.map((d, i) => i === index ? { ...d, [field]: value } : d)
    onChange("itinerary", next)
  }

  const updateDayField = (index, field, value) => {
    const next = days.map((d, i) => i === index ? { ...d, [field]: value } : d)
    onChange("itinerary", next)
  }

  const addDay = () => {
    onChange("itinerary", [...days, { day: days.length + 1, title: "", description: "", activities: [], meals: [] }])
  }

  const removeDay = (index) => {
    const next = days.filter((_, i) => i !== index).map((d, i) => ({ ...d, day: i + 1 }))
    onChange("itinerary", next)
  }

  const addActivity = (dayIndex) => {
    const day = days[dayIndex]
    updateDay(dayIndex, "activities", [...(day.activities || []), ""])
  }

  const updateActivity = (dayIndex, actIndex, value) => {
    const day = days[dayIndex]
    const next = day.activities.map((a, i) => i === actIndex ? value : a)
    updateDay(dayIndex, "activities", next)
  }

  const removeActivity = (dayIndex, actIndex) => {
    const day = days[dayIndex]
    updateDay(dayIndex, "activities", day.activities.filter((_, i) => i !== actIndex))
  }

  const toggleMeal = (dayIndex, meal) => {
    const day = days[dayIndex]
    const meals = day.meals || []
    const next = meals.includes(meal) ? meals.filter((m) => m !== meal) : [...meals, meal]
    updateDay(dayIndex, "meals", next)
  }

  const MEAL_OPTIONS = ["Breakfast", "Lunch", "Dinner"]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700">Day-by-day Itinerary</p>
          <p className="text-xs text-gray-400 mt-0.5">Plan each day of the tour with activities and meals</p>
        </div>
        {errors?.itinerary && <p className="text-xs text-red-500">{errors.itinerary}</p>}
      </div>

      {days.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-sm text-gray-400">No itinerary days yet. Add the first day below.</p>
        </div>
      )}

      <div className="space-y-4">
        {days.map((day, dayIndex) => (
          <div key={dayIndex} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2.5 border-b border-gray-200">
              <GripVertical className="h-4 w-4 text-gray-300" />
              <span className="text-sm font-semibold text-gray-700">Day {day.day}</span>
              <div className="flex-1" />
              <button type="button" onClick={() => removeDay(dayIndex)}
                className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50" title="Remove day">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input id={`day-title-${dayIndex}`} label="Day Title" placeholder="e.g. Rock-Hewn Churches" required value={day.title || ""} onChange={(e) => updateDay(dayIndex, "title", e.target.value)} />
              </div>

              <Textarea id={`day-desc-${dayIndex}`} label="Description" rows={2} placeholder="What happens on this day..." value={day.description || ""} onChange={(e) => updateDay(dayIndex, "description", e.target.value)} />

              <div>
                <p className="text-xs font-medium text-gray-600 mb-1.5">Activities</p>
                <div className="space-y-2">
                  {(day.activities || []).map((act, actIndex) => (
                    <div key={actIndex} className="flex items-center gap-2">
                      <Input value={act} placeholder="Activity name" onChange={(e) => updateActivity(dayIndex, actIndex, e.target.value)} />
                      <button type="button" onClick={() => removeActivity(dayIndex, actIndex)}
                        className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600" aria-label="Remove activity">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={() => addActivity(dayIndex)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700">
                    <PlusCircle className="h-3.5 w-3.5" /> Add activity
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-600 mb-1.5">Meals</p>
                <div className="flex gap-3">
                  {MEAL_OPTIONS.map((meal) => (
                    <label key={meal} className="inline-flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                      <input type="checkbox" checked={(day.meals || []).includes(meal)} onChange={() => toggleMeal(dayIndex, meal)}
                        className="rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
                      {meal}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={addDay}
        className="w-full inline-flex items-center justify-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 py-2 border border-dashed border-brand-300 rounded-lg hover:bg-brand-50 transition-colors">
        <PlusCircle className="h-4 w-4" /> Add Day
      </button>
    </div>
  )
}
