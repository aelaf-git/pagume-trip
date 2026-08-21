import { api } from "./api";

function toApi(body) {
  return {
    name: body.name,
    description: body.description || null,
    region: body.region || null,
    zone: body.zone || null,
    woreda: body.woreda || null,
    latitude: body.latitude != null && body.latitude !== "" ? Number(body.latitude) : null,
    longitude:
      body.longitude != null && body.longitude !== "" ? Number(body.longitude) : null,
    category: body.category || null,
    historical_info: body.historicalInfo || body.historical_info || null,
    accessibility: body.accessibility || null,
    seasonal_info: body.seasonalInfo || body.seasonal_info || null,
    images: body.images || [],
    status: body.status || "ACTIVE",
    verification_status: body.verificationStatus || body.verification_status || "VERIFIED",
  };
}

function fromApi(d) {
  const images = d.images || [];
  return {
    id: d.id,
    name: d.name,
    description: d.description,
    region: d.region,
    zone: d.zone,
    woreda: d.woreda,
    latitude: d.latitude,
    longitude: d.longitude,
    category: d.category,
    historicalInfo: d.historical_info,
    accessibility: d.accessibility,
    seasonalInfo: d.seasonal_info,
    images,
    coverImage: images[0] || "",
    status: d.status,
    verificationStatus: d.verification_status,
  };
}

export async function getDestinations() {
  const rows = await api.get("/admin/destinations");
  return rows.map(fromApi);
}

export async function getDestination(id) {
  const rows = await getDestinations();
  return rows.find((d) => String(d.id) === String(id)) || null;
}

export async function createDestination(body) {
  const d = await api.post("/admin/destinations", toApi(body));
  return fromApi(d);
}

export async function updateDestination(id, body) {
  const d = await api.put(`/admin/destinations/${id}`, toApi(body));
  return fromApi(d);
}

export async function deleteDestination(id) {
  await api.del(`/admin/destinations/${id}`);
  return true;
}

export async function importDestinations(items) {
  const rows = await api.post(
    "/admin/destinations/import",
    items.map((item) => toApi(item))
  );
  return rows.map(fromApi);
}

/** Upload destination cover/gallery image via Cloudinary. */
export async function uploadDestinationImage(file, kind = "gallery") {
  const form = new FormData();
  form.append("file", file);
  const row = await api.postForm(
    `/uploads/images?kind=${encodeURIComponent(kind)}&scope=destinations`,
    form
  );
  return row.url;
}
