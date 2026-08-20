import { useCallback, useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Textarea from "../../components/common/Textarea";
import Button from "../../components/common/Button";
import * as inventoryService from "../../services/inventoryService";

const EMPTY = {
  name: "",
  description: "",
  address: "",
  latitude: "",
  longitude: "",
  contactDetails: "",
  checkInTime: "14:00",
  checkOutTime: "11:00",
  cancellationPolicy: "",
  amenities: "",
  images: "",
};

export default function HotelProperty() {
  const [hotelId, setHotelId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const hotels = await inventoryService.getHotels();
      if (hotels[0]) {
        const h = hotels[0];
        setHotelId(h.id);
        setForm({
          name: h.name ?? "",
          description: h.description ?? "",
          address: h.address ?? "",
          latitude: h.latitude != null ? String(h.latitude) : "",
          longitude: h.longitude != null ? String(h.longitude) : "",
          contactDetails: h.contactDetails ?? "",
          checkInTime: h.checkInTime ?? "14:00",
          checkOutTime: h.checkOutTime ?? "11:00",
          cancellationPolicy: h.cancellationPolicy ?? "",
          amenities: (h.amenities ?? []).join(", "),
          images: (h.images ?? []).join(", "),
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        address: form.address,
        latitude: form.latitude,
        longitude: form.longitude,
        contactDetails: form.contactDetails,
        checkInTime: form.checkInTime,
        checkOutTime: form.checkOutTime,
        cancellationPolicy: form.cancellationPolicy,
        amenities: form.amenities
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        images: form.images
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        policies: {},
      };
      if (hotelId) await inventoryService.updateHotel(hotelId, payload);
      else {
        const created = await inventoryService.createHotel(payload);
        setHotelId(created.id);
      }
      setNotice("Property saved.");
      setTimeout(() => setNotice(null), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading property…</p>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hotel / resort profile"
        description="Name, location, amenities, policies, and check-in details."
      />
      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Contact details"
            value={form.contactDetails}
            onChange={(e) => setForm((f) => ({ ...f, contactDetails: e.target.value }))}
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Address"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>
          <Input
            label="Latitude"
            value={form.latitude}
            onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
          />
          <Input
            label="Longitude"
            value={form.longitude}
            onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
          />
          <Input
            label="Check-in time"
            value={form.checkInTime}
            onChange={(e) => setForm((f) => ({ ...f, checkInTime: e.target.value }))}
          />
          <Input
            label="Check-out time"
            value={form.checkOutTime}
            onChange={(e) => setForm((f) => ({ ...f, checkOutTime: e.target.value }))}
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Cancellation policy"
              value={form.cancellationPolicy}
              onChange={(e) => setForm((f) => ({ ...f, cancellationPolicy: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Amenities (comma-separated)"
              value={form.amenities}
              onChange={(e) => setForm((f) => ({ ...f, amenities: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Image URLs (comma-separated)"
              value={form.images}
              onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={save} loading={saving}>
            Save property
          </Button>
          {notice && <p className="text-sm text-green-600">{notice}</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </Card>
    </div>
  );
}
