import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, CarFront } from "lucide-react";
import Card from "../common/Card";
import Button from "../common/Button";
import Input from "../common/Input";
import Select from "../common/Select";
import Textarea from "../common/Textarea";
import Checkbox from "../common/Checkbox";
import Modal from "../common/Modal";
import Badge from "../common/Badge";
import ConfirmDialog from "../common/ConfirmDialog";
import { ImageGalleryField } from "../common/ImageUploadFields";
import { TRANSMISSION_TYPES } from "../../constants/registrationOptions";
import { FUEL_TYPES, DRIVER_AVAILABILITY_OPTIONS } from "../../constants/inventoryOptions";
import { validateVehicle } from "../../utils/inventoryValidation";
import * as inventoryService from "../../services/inventoryService";
import { queryKeys, STALE_VEHICLES_MS } from "../../lib/queryKeys";

const EMPTY_FORM = {
  make: "",
  model: "",
  year: "",
  seats: "",
  transmission: "",
  fuelType: "",
  fourWheelDrive: false,
  category: "car",
  dailyPrice: "",
  weeklyPrice: "",
  deposit: "",
  insurance: "",
  driverAvailability: "",
  pickupLocations: "",
  dropoffLocations: "",
  rentalPolicies: "",
  availabilityDates: "",
  images: [],
};

const OPTION_LABELS = (options) => Object.fromEntries(options.map(({ value, label }) => [value, label]));

const TRANSMISSION_LABELS = OPTION_LABELS(TRANSMISSION_TYPES);
const FUEL_LABELS = OPTION_LABELS(FUEL_TYPES);
const DRIVER_LABELS = OPTION_LABELS(DRIVER_AVAILABILITY_OPTIONS);

export default function VehicleFleetManagement() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [notice, setNotice] = useState(null);
  const noticeTimer = useRef(null);

  const vehiclesQuery = useQuery({
    queryKey: queryKeys.vehicles,
    queryFn: () => inventoryService.getVehicles(),
    staleTime: STALE_VEHICLES_MS,
  });

  const vehicles = vehiclesQuery.data ?? [];
  const loading = vehiclesQuery.isLoading;

  const showNotice = (message) => {
    setNotice(message);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3000);
  };

  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (vehicle) => {
    setEditing(vehicle);
    setForm({
      make: vehicle.make,
      model: vehicle.model,
      year: String(vehicle.year ?? ""),
      seats: String(vehicle.seats ?? ""),
      transmission: vehicle.transmission ?? "",
      fuelType: vehicle.fuelType ?? "",
      fourWheelDrive: Boolean(vehicle.fourWheelDrive),
      category: vehicle.category ?? "car",
      dailyPrice: String(vehicle.dailyPrice ?? ""),
      weeklyPrice: String(vehicle.weeklyPrice ?? ""),
      deposit: String(vehicle.deposit ?? ""),
      insurance: vehicle.insurance ?? "",
      driverAvailability: vehicle.driverAvailability ?? "",
      pickupLocations: (vehicle.pickupLocations ?? []).join(", "),
      dropoffLocations: (vehicle.dropoffLocations ?? []).join(", "),
      rentalPolicies: vehicle.rentalPolicies ?? "",
      availabilityDates: (vehicle.availabilityDates ?? []).join(", "),
      images: (vehicle.images ?? []).filter(Boolean),
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const splitList = (value) =>
    String(value || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const handleSave = async () => {
    const validationErrors = validateVehicle(form);
    if (Object.keys(validationErrors).length > 0) return setErrors(validationErrors);

    setSaving(true);
    const payload = {
      make: form.make,
      model: form.model,
      year: Number(form.year),
      seats: Number(form.seats),
      transmission: form.transmission,
      fuelType: form.fuelType,
      fourWheelDrive: form.fourWheelDrive,
      category: form.category || "car",
      dailyPrice: Number(form.dailyPrice),
      weeklyPrice: form.weeklyPrice === "" ? null : Number(form.weeklyPrice),
      deposit: form.deposit === "" ? null : Number(form.deposit),
      insurance: form.insurance,
      driverAvailability: form.driverAvailability,
      pickupLocations: splitList(form.pickupLocations),
      dropoffLocations: splitList(form.dropoffLocations),
      rentalPolicies: form.rentalPolicies,
      availabilityDates: splitList(form.availabilityDates),
      images: form.images ?? [],
    };

    try {
      if (editing) {
        await inventoryService.updateVehicle(editing.id, payload);
        showNotice("Vehicle updated.");
      } else {
        await inventoryService.createVehicle(payload);
        showNotice("Vehicle added to your fleet.");
      }
      setModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.vehicles });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeletingId(deleting.id);
    try {
      await inventoryService.deleteVehicle(deleting.id);
      showNotice("Vehicle removed from your fleet.");
      setDeleting(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.vehicles });
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
          {vehicles.length} vehicle{vehicles.length === 1 ? "" : "s"} in your fleet
        </p>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Vehicle
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-gray-400">Loading fleet…</div>
        ) : vehicles.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <CarFront className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No vehicles yet. Add your first vehicle to start renting.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3 font-medium">Vehicle</th>
                  <th className="px-4 py-3 font-medium">Year</th>
                  <th className="px-4 py-3 font-medium">Seats</th>
                  <th className="px-4 py-3 font-medium">Transmission</th>
                  <th className="px-4 py-3 font-medium">Fuel</th>
                  <th className="px-4 py-3 font-medium">4WD</th>
                  <th className="px-4 py-3 font-medium">Photos</th>
                  <th className="px-4 py-3 font-medium">Daily / Weekly</th>
                  <th className="px-4 py-3 font-medium">Driver</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {vehicle.make} {vehicle.model}
                      </p>
                      <p className="text-xs text-gray-400">
                        Deposit: ETB {(vehicle.deposit ?? 0).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{vehicle.year}</td>
                    <td className="px-4 py-3 text-gray-700">{vehicle.seats}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {TRANSMISSION_LABELS[vehicle.transmission] ?? vehicle.transmission}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{FUEL_LABELS[vehicle.fuelType] ?? vehicle.fuelType}</td>
                    <td className="px-4 py-3">
                      {vehicle.fourWheelDrive ? (
                        <Badge tone="brand">4WD</Badge>
                      ) : (
                        <Badge tone="gray">2WD</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{(vehicle.images ?? []).length}</td>
                    <td className="px-4 py-3 text-gray-700">
                      <p>ETB {(vehicle.dailyPrice ?? 0).toLocaleString()} / day</p>
                      <p className="text-xs text-gray-400">
                        ETB {(vehicle.weeklyPrice ?? 0).toLocaleString()} / week
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {DRIVER_LABELS[vehicle.driverAvailability] ?? vehicle.driverAvailability}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(vehicle)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-brand-600"
                          aria-label={`Edit ${vehicle.make} ${vehicle.model}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(vehicle)}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Delete ${vehicle.make} ${vehicle.model}`}
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
        title={editing ? "Edit Vehicle" : "Add Vehicle"}
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editing ? "Save Changes" : "Add Vehicle"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="make"
              label="Make"
              value={form.make}
              error={errors.make}
              onChange={(e) => handleChange("make", e.target.value)}
              required
            />
            <Input
              id="model"
              label="Model"
              value={form.model}
              error={errors.model}
              onChange={(e) => handleChange("model", e.target.value)}
              required
            />
            <Input
              id="year"
              label="Year"
              type="number"
              min="1950"
              max="2030"
              value={form.year}
              error={errors.year}
              onChange={(e) => handleChange("year", e.target.value)}
            />
            <Input
              id="seats"
              label="Seats"
              type="number"
              min="1"
              value={form.seats}
              error={errors.seats}
              onChange={(e) => handleChange("seats", e.target.value)}
            />
            <Select
              id="transmission"
              label="Transmission"
              options={TRANSMISSION_TYPES}
              value={form.transmission}
              error={errors.transmission}
              onChange={(e) => handleChange("transmission", e.target.value)}
              required
            />
            <Select
              id="fuelType"
              label="Fuel type"
              options={FUEL_TYPES}
              value={form.fuelType}
              error={errors.fuelType}
              onChange={(e) => handleChange("fuelType", e.target.value)}
              required
            />
            <Input
              id="dailyPrice"
              label="Daily price (ETB)"
              type="number"
              min="0"
              value={form.dailyPrice}
              error={errors.dailyPrice}
              onChange={(e) => handleChange("dailyPrice", e.target.value)}
            />
            <Input
              id="weeklyPrice"
              label="Weekly price (ETB)"
              type="number"
              min="0"
              value={form.weeklyPrice}
              error={errors.weeklyPrice}
              onChange={(e) => handleChange("weeklyPrice", e.target.value)}
            />
            <Input
              id="deposit"
              label="Deposit (ETB)"
              type="number"
              min="0"
              value={form.deposit}
              error={errors.deposit}
              onChange={(e) => handleChange("deposit", e.target.value)}
            />
            <Select
              id="driverAvailability"
              label="Driver availability"
              options={DRIVER_AVAILABILITY_OPTIONS}
              value={form.driverAvailability}
              error={errors.driverAvailability}
              onChange={(e) => handleChange("driverAvailability", e.target.value)}
              required
            />
            <Input
              id="category"
              label="Category"
              value={form.category ?? "car"}
              onChange={(e) => handleChange("category", e.target.value)}
            />
            <Input
              id="pickupLocations"
              label="Pickup locations (comma-separated)"
              value={form.pickupLocations ?? ""}
              onChange={(e) => handleChange("pickupLocations", e.target.value)}
            />
            <Input
              id="dropoffLocations"
              label="Drop-off locations (comma-separated)"
              value={form.dropoffLocations ?? ""}
              onChange={(e) => handleChange("dropoffLocations", e.target.value)}
            />
            <Input
              id="availabilityDates"
              label="Availability dates (comma YYYY-MM-DD)"
              value={form.availabilityDates ?? ""}
              onChange={(e) => handleChange("availabilityDates", e.target.value)}
            />
          </div>
          <Textarea
            id="rentalPolicies"
            label="Rental policies"
            rows={2}
            value={form.rentalPolicies ?? ""}
            onChange={(e) => handleChange("rentalPolicies", e.target.value)}
          />

          <Checkbox
            id="fourWheelDrive"
            label="4WD vehicle"
            description="Mark if this vehicle has four-wheel drive for off-road routes."
            checked={Boolean(form.fourWheelDrive)}
            onChange={(e) => handleChange("fourWheelDrive", e.target.checked)}
          />

          <Textarea
            id="insurance"
            label="Insurance details"
            rows={2}
            placeholder="Describe coverage, excess, and what's included…"
            value={form.insurance}
            onChange={(e) => handleChange("insurance", e.target.value)}
          />

          <ImageGalleryField
            label="Vehicle photos"
            hint="Upload images to Cloudinary for this vehicle."
            value={form.images}
            onChange={(urls) => handleChange("images", urls)}
            onUpload={(file) => inventoryService.uploadVehicleImage(file, "gallery")}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete vehicle"
        message={`Remove "${deleting?.make} ${deleting?.model}" from your fleet? This cannot be undone.`}
        onConfirm={handleDelete}
        confirming={Boolean(deletingId)}
      />
    </div>
  );
}
