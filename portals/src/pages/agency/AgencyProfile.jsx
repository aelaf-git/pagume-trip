import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Input from "../../components/common/Input";
import Textarea from "../../components/common/Textarea";
import Button from "../../components/common/Button";
import { ImageSingleField } from "../../components/common/ImageUploadFields";
import { useAuth } from "../../contexts/AuthContext";
import * as inventoryService from "../../services/inventoryService";
import { queryKeys, STALE_PROFILE_MS } from "../../lib/queryKeys";

export default function AgencyProfile() {
  const { user, setAvatarUrl } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    businessName: "",
    phone: "",
    address: "",
    description: "",
    website: "",
    coverImage: "",
    logo: "",
  });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  const profileQuery = useQuery({
    queryKey: [...queryKeys.profile, user?.id],
    queryFn: () => inventoryService.getProviderProfile(),
    staleTime: STALE_PROFILE_MS,
    enabled: Boolean(user?.id),
  });

  useEffect(() => {
    if (!profileQuery.data || hydrated) return;
    const p = profileQuery.data;
    setForm({
      businessName: p.businessName ?? "",
      phone: p.phone ?? "",
      address: p.address ?? "",
      description: p.description ?? "",
      website: p.website ?? "",
      coverImage: p.coverImage ?? "",
      logo: p.logo ?? "",
    });
    if (p.logo) setAvatarUrl(p.logo);
    setHydrated(true);
  }, [profileQuery.data, hydrated, setAvatarUrl]);

  const persistImages = async (patch) => {
    setError(null);
    try {
      const updated = await inventoryService.updateProviderProfile({
        businessName: form.businessName,
        phone: form.phone,
        address: form.address,
        description: form.description,
        website: form.website,
        coverImage: patch.coverImage !== undefined ? patch.coverImage : form.coverImage,
        logo: patch.logo !== undefined ? patch.logo : form.logo,
      });
      setForm((f) => ({
        ...f,
        coverImage: updated.coverImage ?? f.coverImage,
        logo: updated.logo ?? f.logo,
      }));
      if (patch.logo !== undefined) setAvatarUrl(updated.logo || null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      setNotice("Photo saved.");
      setTimeout(() => setNotice(null), 2000);
    } catch (err) {
      setError(err.message || "Could not save photo.");
      throw err;
    }
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await inventoryService.updateProviderProfile(form);
      setAvatarUrl(form.logo || null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      setNotice("Agency profile saved.");
      setTimeout(() => setNotice(null), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (profileQuery.isLoading && !hydrated) {
    return <p className="text-sm text-gray-500">Loading agency profile…</p>;
  }

  if (profileQuery.isError) {
    return (
      <p className="text-sm text-red-500">
        {profileQuery.error?.message || "Could not load profile."}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agency profile"
        description="Business details and branding shown to travelers and admins."
      />

      <Card title="Branding">
        <div className="space-y-6">
          <ImageSingleField
            label="Cover image"
            hint="Wide banner for your agency presence."
            aspect="cover"
            value={form.coverImage}
            onChange={async (url) => {
              setForm((f) => ({ ...f, coverImage: url }));
              await persistImages({ coverImage: url });
            }}
            onUpload={(file) => inventoryService.uploadAgencyImage(file, "cover")}
          />
          <div className="max-w-xs">
            <ImageSingleField
              label="Logo"
              hint="Shown in the navbar and marketplace listings."
              aspect="profile"
              value={form.logo}
              onChange={async (url) => {
                setForm((f) => ({ ...f, logo: url }));
                setAvatarUrl(url || null);
                await persistImages({ logo: url });
              }}
              onUpload={(file) => inventoryService.uploadAgencyImage(file, "logo")}
            />
          </div>
        </div>
      </Card>

      <Card title="Business details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Business name"
            value={form.businessName}
            onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <div className="sm:col-span-2">
            <Input
              label="Address"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Website"
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label="About the agency"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={save} loading={saving}>
            Save profile
          </Button>
          {notice && <p className="text-sm text-green-600">{notice}</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </Card>
    </div>
  );
}
