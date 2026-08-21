import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Textarea from "../../components/common/Textarea";
import Button from "../../components/common/Button";
import {
  ImageGalleryField,
  ImageSingleField,
} from "../../components/common/ImageUploadFields";
import { useAuth } from "../../contexts/AuthContext";
import * as inventoryService from "../../services/inventoryService";
import { queryKeys, STALE_HOTEL_MS } from "../../lib/queryKeys";

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
  coverImage: "",
  profilePicture: "",
  images: [],
};

function hotelToForm(h) {
  return {
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
    coverImage: h.coverImage ?? "",
    profilePicture: h.profilePicture ?? "",
    images: h.images ?? [],
  };
}

export default function HotelProperty() {
  const { user, setAvatarUrl } = useAuth();
  const queryClient = useQueryClient();
  const [hotelId, setHotelId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [formReady, setFormReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);
  const seededFrom = useRef(null);

  const hotelsQuery = useQuery({
    queryKey: [...queryKeys.hotels, user?.id],
    queryFn: () => inventoryService.getHotels(),
    staleTime: STALE_HOTEL_MS,
    enabled: Boolean(user?.id),
  });

  useEffect(() => {
    if (!hotelsQuery.isFetched) return;
    const h = hotelsQuery.data?.[0];
    if (!h) {
      setFormReady(true);
      return;
    }
    const stamp = `${h.id}:${hotelsQuery.dataUpdatedAt}`;
    if (seededFrom.current === stamp) {
      setFormReady(true);
      return;
    }
    seededFrom.current = stamp;
    setHotelId(h.id);
    setForm(hotelToForm(h));
    setFormReady(true);
    setAvatarUrl(h.profilePicture || null);
  }, [
    hotelsQuery.isFetched,
    hotelsQuery.data,
    hotelsQuery.dataUpdatedAt,
    setAvatarUrl,
  ]);

  const invalidateHotels = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.hotels });

  const persistImages = async (patch) => {
    setPhotoSaving(true);
    setError(null);
    try {
      let id = hotelId;
      if (!id) {
        id = await inventoryService.ensureHotelId();
        setHotelId(id);
      }
      const updated = await inventoryService.updateHotelImages(id, patch);
      setForm((f) => ({
        ...f,
        ...(patch.coverImage !== undefined
          ? { coverImage: updated.coverImage || patch.coverImage || "" }
          : {}),
        ...(patch.profilePicture !== undefined
          ? { profilePicture: updated.profilePicture || patch.profilePicture || "" }
          : {}),
        ...(patch.images !== undefined
          ? { images: updated.images ?? patch.images ?? [] }
          : {}),
      }));
      if (patch.profilePicture !== undefined) {
        setAvatarUrl(updated.profilePicture || patch.profilePicture || null);
      }
      await invalidateHotels();
      setNotice("Photo saved.");
      setTimeout(() => setNotice(null), 2000);
    } catch (err) {
      setError(err.message || "Could not save photo.");
      throw err;
    } finally {
      setPhotoSaving(false);
    }
  };

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
        coverImage: form.coverImage || "",
        profilePicture: form.profilePicture || "",
        images: form.images ?? [],
        policies: {},
      };
      if (hotelId) await inventoryService.updateHotel(hotelId, payload);
      else {
        const created = await inventoryService.createHotel(payload);
        setHotelId(created.id);
      }
      setAvatarUrl(payload.profilePicture || null);
      await invalidateHotels();
      setNotice("Property saved.");
      setTimeout(() => setNotice(null), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (hotelsQuery.isLoading || !formReady) {
    return <p className="text-sm text-gray-500">Loading property…</p>;
  }

  if (hotelsQuery.isError) {
    return (
      <p className="text-sm text-red-500">
        {hotelsQuery.error?.message || "Could not load property."}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hotel / resort profile"
        description="Name, location, amenities, policies, photos, and check-in details."
      />

      <Card title="Photos">
        <p className="mb-4 text-xs text-gray-500">
          Photos upload to Cloudinary and are saved to your property automatically.
          {photoSaving ? " Saving…" : ""}
        </p>
        <div className="space-y-6">
          <ImageSingleField
            label="Cover image"
            hint="Wide banner shown at the top of your property page."
            aspect="cover"
            value={form.coverImage}
            onChange={async (url) => {
              setForm((f) => ({ ...f, coverImage: url }));
              await persistImages({ coverImage: url });
            }}
            onUpload={(file) => inventoryService.uploadHotelImage(file, "cover")}
          />
          <div className="max-w-xs">
            <ImageSingleField
              label="Profile picture"
              hint="Square logo or property portrait. Shown in the navbar."
              aspect="profile"
              value={form.profilePicture}
              onChange={async (url) => {
                setForm((f) => ({ ...f, profilePicture: url }));
                setAvatarUrl(url || null);
                await persistImages({ profilePicture: url });
              }}
              onUpload={(file) => inventoryService.uploadHotelImage(file, "profile")}
            />
          </div>
          <ImageGalleryField
            label="Gallery"
            hint="Additional photos guests will browse."
            value={form.images}
            onChange={async (urls) => {
              setForm((f) => ({ ...f, images: urls }));
              await persistImages({ images: urls });
            }}
            onUpload={(file) => inventoryService.uploadHotelImage(file, "gallery")}
          />
        </div>
      </Card>

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
              onChange={(e) =>
                setForm((f) => ({ ...f, cancellationPolicy: e.target.value }))
              }
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Amenities (comma-separated)"
              value={form.amenities}
              onChange={(e) => setForm((f) => ({ ...f, amenities: e.target.value }))}
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
