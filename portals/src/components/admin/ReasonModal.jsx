import { useState, useEffect } from "react"
import Modal from "../common/Modal"
import Textarea from "../common/Textarea"
import Button from "../common/Button"

export default function ReasonModal({ open, title, confirmLabel = "Confirm", confirmVariant = "danger", onClose, onConfirm }) {
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setReason("")
      setSaving(false)
    }
  }, [open])

  const handleConfirm = async () => {
    if (!reason.trim()) return
    setSaving(true)
    await onConfirm(reason.trim())
    setSaving(false)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant={confirmVariant} loading={saving} disabled={!reason.trim()} onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <Textarea
        label="Reason"
        placeholder="Provide a reason for this action..."
        rows={4}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        required
      />
    </Modal>
  )
}
