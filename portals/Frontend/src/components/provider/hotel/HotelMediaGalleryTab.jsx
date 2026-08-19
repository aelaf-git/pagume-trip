import { useRef, useState } from "react"
import { Upload, X, GripVertical, ImageIcon } from "lucide-react"
import { placeholderImage } from "../../../constants/hotelProfileOptions"

function MediaCard({ item, isEditing, onRemove, onPointerDown }) {
  const src = item.url || placeholderImage(item.name, item.placeholder || "#0f9d58")

  return (
    <div
      className="group relative rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm"
      onPointerDown={isEditing ? onPointerDown : undefined}
    >
      <div className="aspect-[3/2] bg-gray-100">
        <img
          src={src}
          alt={item.name}
          className="w-full h-full object-cover"
          draggable={false}
        />
      </div>
      <div className="px-3 py-2">
        <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
      </div>
      {isEditing && (
        <>
          <button
            type="button"
            className="absolute top-2 left-2 p-1 rounded bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
            onPointerDown={(e) => {
              e.stopPropagation()
              onPointerDown?.(e, item.id)
            }}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="absolute top-2 right-2 p-1 rounded bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  )
}

export default function HotelMediaGalleryTab({ data, isEditing, onChange }) {
  const fileInputRef = useRef(null)
  const [dragId, setDragId] = useState(null)

  const media = data.media || []

  const sortedMedia = [...media].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

  const handleUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const newItem = {
      id: `media-${Date.now()}`,
      name: file.name.replace(/\.[^.]+$/, ""),
      placeholder: `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}`,
      order: media.length,
    }
    onChange("media", [...media, newItem])
    e.target.value = ""
  }

  const handleRemove = (id) => {
    onChange(
      "media",
      media
        .filter((m) => m.id !== id)
        .map((m, i) => ({ ...m, order: i }))
    )
  }

  const handlePointerDown = (e, id) => {
    if (!isEditing) return
    setDragId(id)
  }

  const handlePointerMove = (e) => {
    if (!dragId || !isEditing) return
    const el = document.elementFromPoint(e.clientX, e.clientY)
    const card = el?.closest("[data-media-id]")
    if (!card) return
    const targetId = card.dataset.mediaId
    if (targetId === dragId) return

    const items = [...media]
    const dragIdx = items.findIndex((m) => m.id === dragId)
    const targetIdx = items.findIndex((m) => m.id === targetId)
    if (dragIdx === -1 || targetIdx === -1) return

    const [moved] = items.splice(dragIdx, 1)
    items.splice(targetIdx, 0, moved)
    onChange(
      "media",
      items.map((m, i) => ({ ...m, order: i }))
    )
  }

  const handlePointerUp = () => {
    setDragId(null)
  }

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {sortedMedia.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ImageIcon className="h-10 w-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No images yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {sortedMedia.map((item) => (
            <div key={item.id} data-media-id={item.id}>
              <MediaCard
                item={item}
                isEditing={isEditing}
                onRemove={handleRemove}
                onPointerDown={handlePointerDown}
              />
            </div>
          ))}
        </div>
      )}

      {isEditing && (
        <div className="mt-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            <Upload className="h-4 w-4" />
            Upload Image
          </button>
        </div>
      )}
    </div>
  )
}
