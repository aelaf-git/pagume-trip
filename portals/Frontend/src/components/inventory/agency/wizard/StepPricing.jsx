import { useState } from "react"
import { X, ImageIcon } from "lucide-react"
import Input from "../../../common/Input"
import Textarea from "../../../common/Textarea"
import Checkbox from "../../../common/Checkbox"
import { INCLUSION_OPTIONS, EXCLUSION_OPTIONS } from "../../../../constants/inventoryOptions"
import { placeholderImage } from "../../../../constants/mockInventoryData"

export default function StepPricing({ data, errors, onChange }) {
  const [imageUrl, setImageUrl] = useState("")

  const handle = (field) => (e) => onChange(field, e.target.value)

  const toggleIncluded = (item) => {
    const current = data.included || []
    const next = current.includes(item) ? current.filter((i) => i !== item) : [...current, item]
    onChange("included", next)
  }

  const toggleExcluded = (item) => {
    const current = data.excluded || []
    const next = current.includes(item) ? current.filter((i) => i !== item) : [...current, item]
    onChange("excluded", next)
  }

  const addCustomIncluded = (value) => {
    if (value.trim()) {
      onChange("included", [...(data.included || []), value.trim()])
    }
  }

  const addCustomExcluded = (value) => {
    if (value.trim()) {
      onChange("excluded", [...(data.excluded || []), value.trim()])
    }
  }

  const addImage = () => {
    const trimmed = imageUrl.trim()
    const name = `Image ${(data.images || []).length + 1}`
    onChange("images", [...(data.images || []), { id: `img-${Date.now()}`, url: trimmed || placeholderImage(name), name }])
    setImageUrl("")
  }

  const removeImage = (imageId) => {
    onChange("images", (data.images || []).filter((img) => img.id !== imageId))
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input id="pkg-price" label="Price per Person (ETB)" type="number" min="0" required value={data.price || ""} onChange={handle("price")} error={errors?.price} />
        <Input id="pkg-min-pax" label="Min Participants" type="number" min="1" value={data.minParticipants || ""} onChange={handle("minParticipants")} error={errors?.minParticipants} />
        <Input id="pkg-max-pax" label="Max Participants" type="number" min="1" value={data.maxParticipants || ""} onChange={handle("maxParticipants")} error={errors?.maxParticipants} />
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Included in Price</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-3">
          {INCLUSION_OPTIONS.map((item) => (
            <Checkbox key={item} id={`incl-${item}`} label={item} checked={(data.included || []).includes(item)} onChange={() => toggleIncluded(item)} />
          ))}
        </div>
        <div className="flex gap-2">
          <Input id="custom-incl" placeholder="Add custom inclusion..." onKeyDown={(e) => {
            if (e.key === "Enter") { addCustomIncluded(e.target.value); e.target.value = "" }
          }} />
        </div>
        {(data.included || []).filter((i) => !INCLUSION_OPTIONS.includes(i)).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {data.included.filter((i) => !INCLUSION_OPTIONS.includes(i)).map((item) => (
              <span key={item} className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs rounded-full px-2.5 py-1">
                {item}
                <button type="button" onClick={() => onChange("included", data.included.filter((i) => i !== item))} className="text-green-400 hover:text-red-500">&times;</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Excluded from Price</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-3">
          {EXCLUSION_OPTIONS.map((item) => (
            <Checkbox key={item} id={`excl-${item}`} label={item} checked={(data.excluded || []).includes(item)} onChange={() => toggleExcluded(item)} />
          ))}
        </div>
        <div className="flex gap-2">
          <Input id="custom-excl" placeholder="Add custom exclusion..." onKeyDown={(e) => {
            if (e.key === "Enter") { addCustomExcluded(e.target.value); e.target.value = "" }
          }} />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Package Images</p>
        <div className="flex flex-wrap gap-3">
          {(data.images || []).map((image) => (
            <div key={image.id} className="relative h-28 w-36 overflow-hidden rounded-lg border border-gray-200">
              {image.url ? (
                <img src={image.url} alt={image.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}
              <button type="button" onClick={() => removeImage(image.id)}
                className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1 text-gray-600 shadow hover:text-red-600">
                <X className="h-3.5 w-3.5" />
              </button>
              <span className="absolute bottom-0 left-0 right-0 truncate bg-black/50 px-2 py-0.5 text-xs text-white">{image.name}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input value={imageUrl} placeholder="Paste image URL or leave blank for placeholder" onChange={(e) => setImageUrl(e.target.value)} />
          <button type="button" onClick={addImage} className="shrink-0 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 px-3 border border-brand-300 rounded-lg hover:bg-brand-50 transition-colors">
            <ImageIcon className="h-4 w-4" /> Add
          </button>
        </div>
      </div>
    </div>
  )
}
