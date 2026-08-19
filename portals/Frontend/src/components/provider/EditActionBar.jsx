import { Pencil, Save, X, CheckCircle2 } from "lucide-react"
import Button from "../common/Button"

/**
 * Reusable edit/save/cancel action bar for profile pages.
 *
 * @param {Object} props
 * @param {boolean} props.isEditing - Whether the page is in edit mode
 * @param {boolean} props.saving - Whether a save is in progress
 * @param {boolean} props.hasChanges - Whether there are unsaved changes
 * @param {() => void} props.onEdit - Enter edit mode
 * @param {() => void} props.onSave - Trigger save
 * @param {() => void} props.onCancel - Exit edit mode without saving
 * @param {string|null} props.notice - Success message to display
 * @param {string} [props.className] - Additional classes
 */
export default function EditActionBar({
  isEditing,
  saving,
  hasChanges,
  onEdit,
  onSave,
  onCancel,
  notice,
  className = "",
}) {
  return (
    <div className={`relative ${className}`}>
      {notice && (
        <div className="fixed top-4 right-4 z-[100] rounded-lg bg-green-600 text-white px-4 py-2.5 text-sm font-medium shadow-lg flex items-center gap-2 animate-slide-in">
          <CheckCircle2 className="h-4 w-4" />
          {notice}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm px-5 py-3.5 flex items-center justify-between gap-4">
        {isEditing ? (
          <>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {hasChanges && (
                <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Unsaved changes
                </span>
              )}
              {!hasChanges && <span>You are editing your profile.</span>}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={onCancel} disabled={saving}>
                <X className="h-4 w-4" /> Cancel
              </Button>
              <Button size="sm" loading={saving} disabled={!hasChanges} onClick={onSave}>
                <Save className="h-4 w-4" /> Save Changes
              </Button>
            </div>
          </>
        ) : (
          <>
            <span className="text-sm text-gray-500">Viewing your profile information.</span>
            <Button size="sm" onClick={onEdit}>
              <Pencil className="h-4 w-4" /> Edit Profile
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
