import Modal from "./Modal";
import Button from "./Button";

export default function ConfirmDialog({ open, title, message, onClose, onConfirm, confirming = false }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={confirming}>
            Delete
          </Button>
        </>
      }
    >
      <p className="text-sm text-gray-600">{message}</p>
    </Modal>
  );
}
