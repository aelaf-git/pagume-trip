import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, BedDouble } from "lucide-react";
import Card from "../common/Card";
import Button from "../common/Button";
import Input from "../common/Input";
import Select from "../common/Select";
import Textarea from "../common/Textarea";
import Checkbox from "../common/Checkbox";
import Modal from "../common/Modal";
import Badge from "../common/Badge";
import ConfirmDialog from "../common/ConfirmDialog";
import { ROOM_TYPES, AMENITIES_OPTIONS } from "../../constants/registrationOptions";
import { ROOM_AVAILABILITY_OPTIONS } from "../../constants/inventoryOptions";
import { validateRoom } from "../../utils/inventoryValidation";
import * as inventoryService from "../../services/inventoryService";

const EMPTY_FORM = {
  roomType: "",
  description: "",
  capacity: "",
  beds: "",
  amenities: [],
  pricePerNight: "",
  availability: "available",
};

export default function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [notice, setNotice] = useState(null);
  const noticeTimer = useRef(null);

  const showNotice = (message) => {
    setNotice(message);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3000);
  };

  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  const loadRooms = useCallback(async () => {
    const data = await inventoryService.getRooms();
    setRooms(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (room) => {
    setEditing(room);
    setForm({
      roomType: room.roomType,
      description: room.description,
      capacity: String(room.capacity),
      beds: String(room.beds),
      amenities: room.amenities ?? [],
      pricePerNight: String(room.pricePerNight),
      availability: room.availability ? "available" : "unavailable",
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const toggleAmenity = (amenity) => {
    const current = form.amenities ?? [];
    handleChange(
      "amenities",
      current.includes(amenity) ? current.filter((item) => item !== amenity) : [...current, amenity]
    );
  };

  const handleSave = async () => {
    const validationErrors = validateRoom(form);
    if (Object.keys(validationErrors).length > 0) return setErrors(validationErrors);

    setSaving(true);
    const payload = {
      roomType: form.roomType,
      description: form.description,
      capacity: Number(form.capacity),
      beds: Number(form.beds),
      amenities: form.amenities,
      pricePerNight: Number(form.pricePerNight),
      availability: form.availability === "available",
    };

    try {
      if (editing) {
        await inventoryService.updateRoom(editing.id, payload);
        showNotice("Room updated.");
      } else {
        await inventoryService.createRoom(payload);
        showNotice("Room added.");
      }
      setModalOpen(false);
      await loadRooms();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeletingId(deleting.id);
    try {
      await inventoryService.deleteRoom(deleting.id);
      showNotice("Room deleted.");
      setDeleting(null);
      await loadRooms();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {notice && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {notice}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {rooms.length} room{rooms.length === 1 ? "" : "s"} in your inventory
        </p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Room
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-gray-400">Loading rooms…</div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <BedDouble className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No rooms yet. Add your first room to start selling.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3 font-medium">Room Type</th>
                  <th className="px-4 py-3 font-medium">Capacity</th>
                  <th className="px-4 py-3 font-medium">Beds</th>
                  <th className="px-4 py-3 font-medium">Amenities</th>
                  <th className="px-4 py-3 font-medium">Price / night</th>
                  <th className="px-4 py-3 font-medium">Availability</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr key={room.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {ROOM_TYPES.find((t) => t.value === room.roomType)?.label ?? room.roomType}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{room.capacity}</td>
                    <td className="px-4 py-3 text-gray-700">{room.beds}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {room.amenities.slice(0, 3).map((amenity) => (
                          <Badge key={amenity} tone="brand">
                            {amenity}
                          </Badge>
                        ))}
                        {room.amenities.length > 3 && (
                          <Badge tone="gray">+{room.amenities.length - 3} more</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">ETB {room.pricePerNight.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Badge tone={room.availability ? "green" : "red"}>
                        {room.availability ? "Available" : "Unavailable"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(room)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600"
                          aria-label={`Edit ${room.roomType}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(room)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${room.roomType}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Edit Room" : "Add Room"}
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editing ? "Save Changes" : "Add Room"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="roomType"
              label="Room Type"
              options={ROOM_TYPES}
              value={form.roomType}
              error={errors.roomType}
              onChange={(e) => handleChange("roomType", e.target.value)}
              required
            />
            <Select
              id="availability"
              label="Availability"
              options={ROOM_AVAILABILITY_OPTIONS}
              value={form.availability}
              onChange={(e) => handleChange("availability", e.target.value)}
            />
            <Input
              id="capacity"
              label="Capacity (guests)"
              type="number"
              min="1"
              value={form.capacity}
              error={errors.capacity}
              onChange={(e) => handleChange("capacity", e.target.value)}
            />
            <Input
              id="beds"
              label="Beds"
              type="number"
              min="1"
              value={form.beds}
              error={errors.beds}
              onChange={(e) => handleChange("beds", e.target.value)}
            />
            <Input
              id="pricePerNight"
              label="Price per night (ETB)"
              type="number"
              min="0"
              value={form.pricePerNight}
              error={errors.pricePerNight}
              onChange={(e) => handleChange("pricePerNight", e.target.value)}
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Amenities</p>
            <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {AMENITIES_OPTIONS.map((amenity) => (
                <Checkbox
                  key={amenity}
                  id={`room-amenities-${amenity}`}
                  label={amenity}
                  checked={(form.amenities ?? []).includes(amenity)}
                  onChange={() => toggleAmenity(amenity)}
                />
              ))}
            </div>
          </div>

          <Textarea
            id="description"
            label="Description"
            rows={3}
            placeholder="Describe the room, its views, and what guests can expect…"
            value={form.description}
            error={errors.description}
            onChange={(e) => handleChange("description", e.target.value)}
            required
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete room"
        message={`Delete this ${deleting?.roomType}? This cannot be undone.`}
        onConfirm={handleDelete}
        confirming={Boolean(deletingId)}
      />
    </div>
  );
}
