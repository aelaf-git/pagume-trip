import { useState } from "react"
import { ChevronLeft, ChevronRight, Save } from "lucide-react"
import Button from "../../common/Button"
import StepDetails from "./wizard/StepDetails"
import StepItinerary from "./wizard/StepItinerary"
import StepPricing from "./wizard/StepPricing"
import { validatePackage } from "../../../utils/inventoryValidation"

const STEPS = [
  { key: "details", label: "Details & Schedule", component: StepDetails },
  { key: "itinerary", label: "Day-by-Day Itinerary", component: StepItinerary },
  { key: "pricing", label: "Pricing & Inclusions", component: StepPricing },
]

const EMPTY_FORM = {
  name: "",
  description: "",
  destination: "",
  durationDays: "",
  difficulty: "",
  price: "",
  minParticipants: "",
  maxParticipants: "",
  included: [],
  excluded: [],
  activities: [],
  cancellationPolicy: "",
  departureDates: [],
  itinerary: [],
  images: [],
}

export default function PackageWizard({ editing, onSave, onCancel }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(() => {
    if (!editing) return EMPTY_FORM
    return {
      name: editing.name || "",
      description: editing.description || "",
      destination: editing.destination || "",
      durationDays: String(editing.durationDays || ""),
      difficulty: editing.difficulty || "",
      price: String(editing.price || ""),
      minParticipants: String(editing.minParticipants || ""),
      maxParticipants: String(editing.maxParticipants || ""),
      included: editing.included ?? [],
      excluded: editing.excluded ?? [],
      activities: (editing.activities ?? []).map((a) => a.name),
      cancellationPolicy: editing.cancellationPolicy || "",
      departureDates: editing.departureDates ?? [],
      itinerary: (editing.itinerary ?? []).map((d, i) => ({
        ...d,
        day: i + 1,
        activities: d.activities ?? [],
        meals: d.meals ?? [],
      })),
      images: editing.images ?? [],
    }
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const StepComponent = STEPS[step].component

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const validateCurrentStep = () => {
    const allErrors = validatePackage({
      ...form,
      durationDays: Number(form.durationDays) || 0,
      price: Number(form.price) || 0,
      minParticipants: Number(form.minParticipants) || 0,
      maxParticipants: Number(form.maxParticipants) || 0,
    })

    const stepFields = {
      details: ["name", "destination", "durationDays", "difficulty", "departureDates", "cancellationPolicy"],
      itinerary: ["itinerary"],
      pricing: ["price", "minParticipants", "maxParticipants"],
    }

    const current = stepFields[STEPS[step].key] || []
    const stepErrors = {}
    current.forEach((f) => { if (allErrors[f]) stepErrors[f] = allErrors[f] })

    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }

  const handleNext = () => {
    if (validateCurrentStep() && step < STEPS.length - 1) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleSave = () => {
    const allErrors = validatePackage({
      ...form,
      durationDays: Number(form.durationDays) || 0,
      price: Number(form.price) || 0,
      minParticipants: Number(form.minParticipants) || 0,
      maxParticipants: Number(form.maxParticipants) || 0,
    })
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors)
      const firstErrorStep = STEPS.findIndex((s) => {
        const fields = {
          details: ["name", "destination", "durationDays", "difficulty", "departureDates", "cancellationPolicy"],
          itinerary: ["itinerary"],
          pricing: ["price", "minParticipants", "maxParticipants"],
        }
        return fields[s.key]?.some((f) => allErrors[f])
      })
      if (firstErrorStep >= 0) setStep(firstErrorStep)
      return
    }

    setSubmitting(true)
    const payload = {
      name: form.name,
      description: form.description,
      destination: form.destination,
      durationDays: Number(form.durationDays),
      difficulty: form.difficulty,
      price: Number(form.price),
      minParticipants: Number(form.minParticipants),
      maxParticipants: Number(form.maxParticipants),
      included: form.included,
      excluded: form.excluded,
      activities: form.activities.filter((a) => a.trim()).map((name, i) => ({ id: `act-${editing?.id || "new"}-${i}`, name })),
      cancellationPolicy: form.cancellationPolicy,
      departureDates: form.departureDates,
      itinerary: form.itinerary,
      images: form.images,
    }

    try {
      onSave(payload)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col" style={{ minHeight: "70vh" }}>
      <div className="flex items-center gap-0 border-b border-gray-200 mb-6">
        {STEPS.map((s, i) => (
          <button key={s.key} type="button" onClick={() => {
            if (i < step) setStep(i)
            else if (i === step + 1) handleNext()
          }}
            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              i === step ? "border-brand-500 text-brand-600" :
              i < step ? "border-green-400 text-green-600 cursor-pointer" :
              "border-transparent text-gray-400"
            }`}>
            <span className="mr-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold bg-current text-white">
              {i < step ? "\u2713" : i + 1}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-1">
        <StepComponent data={form} errors={errors} onChange={handleChange} />
      </div>

      <div className="flex items-center justify-between pt-5 mt-5 border-t border-gray-200">
        <div>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="outline" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSave} loading={submitting}>
              <Save className="h-4 w-4" /> {editing ? "Save Changes" : "Create Package"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
