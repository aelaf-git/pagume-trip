import { useState, useEffect } from "react";
import Modal from "../common/Modal";
import Input from "../common/Input";
import Select from "../common/Select";
import Textarea from "../common/Textarea";
import Button from "../common/Button";
import {
  ImageGalleryField,
  ImageSingleField,
} from "../common/ImageUploadFields";
import { DESTINATION_CATEGORIES, DESTINATION_REGIONS } from "../../constants/destinationOptions";
import { uploadDestinationImage } from "../../services/destinationService";

const EMPTY_FORM = {
  name: "",
  description: "",
  region: "",
  zone: "",
  woreda: "",
  latitude: "",
  longitude: "",
  category: "",
  historicalInfo: "",
  accessibility: "",
  seasonalInfo: "",
  coverImage: "",
  images: [],
};

function validate(form) {
  const errors = {};
  if (!form.name.trim()) errors.name = "Name is required";
  if (!form.region) errors.region = "Region is required";
  if (!form.category) errors.category = "Category is required";
  if (form.latitude === "" || form.latitude == null) {
    errors.latitude = "Latitude is required";
  } else {
    const lat = Number(form.latitude);
    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
      errors.latitude = "Enter a valid latitude (−90 to 90)";
    }
  }
  if (form.longitude === "" || form.longitude == null) {
    errors.longitude = "Longitude is required";
  } else {
    const lng = Number(form.longitude);
    if (Number.isNaN(lng) || lng < -180 || lng > 180) {
      errors.longitude = "Enter a valid longitude (−180 to 180)";
    }
  }
  return errors;
}

export default function DestinationFormModal({ open, destination, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (destination) {
      const imgs = destination.images || [];
      setForm({
        name: destination.name || "",
        description: destination.description || "",
        region: destination.region || "",
        zone: destination.zone || "",
        woreda: destination.woreda || "",
        latitude: destination.latitude ?? "",
        longitude: destination.longitude ?? "",
        category: destination.category || "",
        historicalInfo: destination.historicalInfo || "",
        accessibility: destination.accessibility || "",
        seasonalInfo: destination.seasonalInfo || "",
        coverImage: destination.coverImage || imgs[0] || "",
        images: imgs,
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
    setSaving(false);
  }, [destination, open]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSave = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    const cover = form.coverImage || "";
    const gallery = (form.images || []).filter(Boolean);
    const images = cover
      ? [cover, ...gallery.filter((u) => u !== cover)]
      : gallery;
    await onSave(destination?.id || null, {
      ...form,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      images,
      coverImage: cover,
    });
    setSaving(false);
  };

  const isEditing = Boolean(destination);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit Destination" : "Add Destination"}
      size="xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button loading={saving} onClick={handleSave}>
            {isEditing ? "Save Changes" : "Create Destination"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="dest-name"
            label="Name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            error={errors.name}
            required
          />
          <Select
            id="dest-category"
            label="Category"
            options={DESTINATION_CATEGORIES}
            value={form.category}
            onChange={(e) => handleChange("category", e.target.value)}
            error={errors.category}
            required
          />
        </div>

        <Textarea
          id="dest-description"
          label="Description"
          rows={3}
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="What tourists can explore here…"
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            id="dest-region"
            label="Region"
            options={DESTINATION_REGIONS}
            value={form.region}
            onChange={(e) => handleChange("region", e.target.value)}
            error={errors.region}
            required
          />
          <Input
            id="dest-zone"
            label="Zone"
            value={form.zone}
            onChange={(e) => handleChange("zone", e.target.value)}
          />
          <Input
            id="dest-woreda"
            label="Woreda"
            value={form.woreda}
            onChange={(e) => handleChange("woreda", e.target.value)}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-800">Location</p>
          <p className="mb-3 text-xs text-gray-500">
            Coordinates used for maps and tourist discovery.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="dest-lat"
              label="Latitude"
              type="number"
              step="any"
              value={form.latitude}
              onChange={(e) => handleChange("latitude", e.target.value)}
              error={errors.latitude}
              required
            />
            <Input
              id="dest-lon"
              label="Longitude"
              type="number"
              step="any"
              value={form.longitude}
              onChange={(e) => handleChange("longitude", e.target.value)}
              error={errors.longitude}
              required
            />
          </div>
        </div>

        <ImageSingleField
          label="Cover image"
          hint="Hero image for marketplace and explorer views."
          aspect="cover"
          value={form.coverImage}
          onChange={(url) => handleChange("coverImage", url)}
          onUpload={(file) => uploadDestinationImage(file, "cover")}
        />

        <ImageGalleryField
          label="Gallery photos"
          hint="Additional destination photos for travelers."
          value={form.images}
          onChange={(urls) => handleChange("images", urls)}
          onUpload={(file) => uploadDestinationImage(file, "gallery")}
        />

        <Textarea
          id="dest-historical"
          label="Historical information"
          rows={3}
          value={form.historicalInfo}
          onChange={(e) => handleChange("historicalInfo", e.target.value)}
          placeholder="Historical background and significance…"
        />

        <Textarea
          id="dest-accessibility"
          label="Accessibility"
          rows={3}
          value={form.accessibility}
          onChange={(e) => handleChange("accessibility", e.target.value)}
          placeholder="How to get there, transportation options…"
        />

        <Textarea
          id="dest-seasonal"
          label="Seasonal advice"
          rows={3}
          value={form.seasonalInfo}
          onChange={(e) => handleChange("seasonalInfo", e.target.value)}
          placeholder="Best times to visit, weather considerations…"
        />
      </div>
    </Modal>
  );
}
