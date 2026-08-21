import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, PlusCircle, Image as ImageIcon, X, Compass } from "lucide-react";
import Card from "../common/Card";
import Button from "../common/Button";
import Input from "../common/Input";
import Select from "../common/Select";
import Textarea from "../common/Textarea";
import Modal from "../common/Modal";
import ConfirmDialog from "../common/ConfirmDialog";
import { DESTINATIONS, DESTINATION_LABELS } from "../../constants/inventoryOptions";
import { placeholderImage } from "../../constants/mockInventoryData";
import { validatePackage } from "../../utils/inventoryValidation";
import * as inventoryService from "../../services/inventoryService";

const EMPTY_FORM = {
  name: "",
  description: "",
  destination: "",
  packageType: "multi_day",
  durationDays: "",
  price: "",
  minParticipants: "",
  maxParticipants: "",
  included: [],
  excluded: [],
  accommodation: "",
  transportation: "",
  activities: [],
  guide: "",
  cancellationPolicy: "",
  images: [],
  availabilityDates: [],
};

const PACKAGE_TYPES = [
  { value: "day_trip", label: "Day trip" },
  { value: "multi_day", label: "Multi-day tour" },
  { value: "custom", label: "Custom tour" },
];

const generateId = () => `dyn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function StringListEditor({ label, hint, items, placeholder, onChange, addLabel = "Add item" }) {
  const addItem = () => onChange([...items, ""]);

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {hint && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
      <div className="space-y-2">
        {items.length === 0 && <p className="text-xs text-gray-400">None added yet.</p>}
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={item}
              placeholder={placeholder}
              onChange={(e) => onChange(items.map((it, i) => (i === index ? e.target.value : it)))}
            />
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
              aria-label={`Remove ${label.toLowerCase()} item`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          <PlusCircle className="h-4 w-4" /> {addLabel}
        </button>
      </div>
    </div>
  );
}

export default function TourPackageBuilder() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [imageUrl, setImageUrl] = useState("");
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

  const loadPackages = useCallback(async () => {
    const data = await inventoryService.getPackages();
    setPackages(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setImageUrl("");
    setModalOpen(true);
  };

  const openEdit = (pkg) => {
    setEditing(pkg);
    setForm({
      name: pkg.name,
      description: pkg.description,
      destination: pkg.destination,
      packageType: pkg.packageType ?? "multi_day",
      durationDays: String(pkg.durationDays ?? ""),
      price: String(pkg.price),
      minParticipants: String(pkg.minParticipants ?? ""),
      maxParticipants: String(pkg.maxParticipants ?? ""),
      included: pkg.included ?? [],
      excluded: pkg.excluded ?? [],
      accommodation: pkg.accommodation ?? "",
      transportation: pkg.transportation ?? "",
      activities: (pkg.activities ?? []).map((activity) =>
        typeof activity === "string" ? activity : activity.name
      ),
      guide: pkg.guide ?? "",
      cancellationPolicy: pkg.cancellationPolicy ?? "",
      images: pkg.images ?? [],
      availabilityDates: pkg.availabilityDates ?? [],
    });
    setErrors({});
    setImageUrl("");
    setModalOpen(true);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const addImage = () => {
    const trimmed = imageUrl.trim();
    const name = `Image ${(form.images ?? []).length + 1}`;
    handleChange("images", [
      ...(form.images ?? []),
      { id: generateId(), url: trimmed || placeholderImage(name), name },
    ]);
    setImageUrl("");
  };

  const removeImage = (imageId) => {
    handleChange("images", (form.images ?? []).filter((image) => image.id !== imageId));
  };

  const handleSave = async () => {
    const validationErrors = validatePackage(form);
    if (Object.keys(validationErrors).length > 0) return setErrors(validationErrors);

    setSaving(true);
    const payload = {
      name: form.name,
      description: form.description,
      destination: form.destination,
      durationDays: Number(form.durationDays),
      price: Number(form.price),
      minParticipants: Number(form.minParticipants),
      maxParticipants: Number(form.maxParticipants),
      included: form.included.filter((item) => item.trim() !== ""),
      excluded: form.excluded.filter((item) => item.trim() !== ""),
      activities: form.activities
        .filter((item) => item.trim() !== "")
        .map((name, index) => ({ id: `act-${editing?.id ?? "new"}-${index}`, name })),
      cancellationPolicy: form.cancellationPolicy,
      images: form.images,
    };

    try {
      if (editing) {
        await inventoryService.updatePackage(editing.id, payload);
        showNotice("Package updated.");
      } else {
        await inventoryService.createPackage(payload);
        showNotice("Package created.");
      }
      setModalOpen(false);
      await loadPackages();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeletingId(deleting.id);
    try {
      await inventoryService.deletePackage(deleting.id);
      showNotice("Package deleted.");
      setDeleting(null);
      await loadPackages();
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
          {packages.length} package{packages.length === 1 ? "" : "s"} in your catalog
        </p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> New Package
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-gray-400">Loading packages…</div>
        ) : packages.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Compass className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No packages yet. Use the builder to create your first tour.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Destination</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Participants</th>
                  <th className="px-4 py-3 font-medium">Activities</th>
                  <th className="px-4 py-3 font-medium">Images</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr key={pkg.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-900">{pkg.name}</td>
                    <td className="px-4 py-3 text-gray-700">{DESTINATION_LABELS[pkg.destination] ?? pkg.destination}</td>
                    <td className="px-4 py-3 text-gray-700">{pkg.durationDays} day{pkg.durationDays === 1 ? "" : "s"}</td>
                    <td className="px-4 py-3 text-gray-700">ETB {pkg.price.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {pkg.minParticipants}–{pkg.maxParticipants}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{(pkg.activities ?? []).length}</td>
                    <td className="px-4 py-3 text-gray-700">{(pkg.images ?? []).length}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(pkg)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600"
                          aria-label={`Edit ${pkg.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(pkg)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${pkg.name}`}
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
        title={editing ? "Edit Package" : "New Tour Package"}
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editing ? "Save Changes" : "Create Package"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="name"
              label="Package name"
              value={form.name}
              error={errors.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
            />
            <Select
              id="destination"
              label="Destination"
              options={DESTINATIONS}
              value={form.destination}
              error={errors.destination}
              onChange={(e) => handleChange("destination", e.target.value)}
              required
            />
            <Input
              id="durationDays"
              label="Duration (days)"
              type="number"
              min="1"
              value={form.durationDays}
              error={errors.durationDays}
              onChange={(e) => handleChange("durationDays", e.target.value)}
            />
            <Input
              id="price"
              label="Price per person (ETB)"
              type="number"
              min="0"
              value={form.price}
              error={errors.price}
              onChange={(e) => handleChange("price", e.target.value)}
            />
            <Input
              id="minParticipants"
              label="Min participants"
              type="number"
              min="1"
              value={form.minParticipants}
              error={errors.minParticipants}
              onChange={(e) => handleChange("minParticipants", e.target.value)}
            />
            <Input
              id="maxParticipants"
              label="Max participants"
              type="number"
              min="1"
              value={form.maxParticipants}
              error={errors.maxParticipants}
              onChange={(e) => handleChange("maxParticipants", e.target.value)}
            />
            <Select
              id="packageType"
              label="Package type"
              options={PACKAGE_TYPES}
              value={form.packageType ?? "multi_day"}
              onChange={(e) => handleChange("packageType", e.target.value)}
            />
            <Input
              id="guide"
              label="Guide"
              value={form.guide ?? ""}
              onChange={(e) => handleChange("guide", e.target.value)}
            />
            <Input
              id="availabilityDates"
              label="Availability dates (comma YYYY-MM-DD)"
              value={(form.availabilityDates ?? []).join(", ")}
              onChange={(e) =>
                handleChange(
                  "availabilityDates",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                )
              }
            />
          </div>

          <Textarea
            id="accommodation"
            label="Accommodation"
            rows={2}
            value={form.accommodation ?? ""}
            onChange={(e) => handleChange("accommodation", e.target.value)}
          />
          <Textarea
            id="transportation"
            label="Transportation"
            rows={2}
            value={form.transportation ?? ""}
            onChange={(e) => handleChange("transportation", e.target.value)}
          />

          <Textarea
            id="description"
            label="Description"
            rows={3}
            placeholder="Describe the highlights of this tour…"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
          />

          <div className="grid gap-5 md:grid-cols-2">
            <StringListEditor
              label="Included services"
              hint="What's covered in the price"
              items={form.included}
              placeholder="e.g. Hotel accommodation"
              onChange={(items) => handleChange("included", items)}
            />
            <StringListEditor
              label="Excluded services"
              hint="What travelers pay extra for"
              items={form.excluded}
              placeholder="e.g. International flights"
              onChange={(items) => handleChange("excluded", items)}
            />
          </div>

          <StringListEditor
            label="Tour activities"
            hint="Daily itinerary items"
            items={form.activities}
            placeholder="e.g. Rock-hewn churches of Lalibela"
            onChange={(items) => handleChange("activities", items)}
            addLabel="Add activity"
          />

          <Textarea
            id="cancellationPolicy"
            label="Cancellation policy"
            rows={2}
            placeholder="e.g. Free cancellation up to 14 days before departure…"
            value={form.cancellationPolicy}
            error={errors.cancellationPolicy}
            onChange={(e) => handleChange("cancellationPolicy", e.target.value)}
            required
          />

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Images</p>
            <div className="flex flex-wrap gap-3">
              {(form.images ?? []).map((image) => (
                <div key={image.id} className="relative h-28 w-36 overflow-hidden rounded-lg border border-gray-200">
                  {image.url ? (
                    <img src={image.url} alt={image.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1 text-gray-600 shadow hover:text-red-600"
                    aria-label={`Remove image ${image.name}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <span className="absolute bottom-0 left-0 right-0 truncate bg-black/50 px-2 py-0.5 text-xs text-white">
                    {image.name}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input
                value={imageUrl}
                placeholder="Paste an image URL, or leave blank for a placeholder"
                onChange={(e) => setImageUrl(e.target.value)}
              />
              <Button variant="outline" onClick={addImage} className="shrink-0">
                <Plus className="h-4 w-4" /> Add image
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete package"
        message={`Delete "${deleting?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        confirming={Boolean(deletingId)}
      />
    </div>
  );
}
