import Modal from "../common/Modal";
import Badge from "../common/Badge";
import Button from "../common/Button";
import { MapPin, Pencil } from "lucide-react";
import {
  DESTINATION_CATEGORIES,
  DESTINATION_REGIONS,
  CATEGORY_TONES,
} from "../../constants/destinationOptions";

function DetailBlock({ label, children }) {
  if (!children) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <div className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">{children}</div>
    </div>
  );
}

export default function DestinationDetailModal({
  open,
  destination,
  onClose,
  onEdit,
}) {
  if (!destination) return null;

  const regionLabel =
    DESTINATION_REGIONS.find((r) => r.value === destination.region)?.label ||
    destination.region ||
    "—";
  const categoryLabel =
    DESTINATION_CATEGORIES.find((c) => c.value === destination.category)?.label ||
    destination.category ||
    "—";
  const images = destination.images?.length
    ? destination.images
    : destination.coverImage
      ? [destination.coverImage]
      : [];
  const cover = destination.coverImage || images[0];
  const locationParts = [destination.woreda, destination.zone, regionLabel].filter(
    Boolean
  );
  const hasCoords =
    destination.latitude != null &&
    destination.longitude != null &&
    destination.latitude !== "" &&
    destination.longitude !== "";
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps?q=${encodeURIComponent(
        `${destination.latitude},${destination.longitude}`
      )}`
    : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={destination.name}
      size="xl"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => {
              onClose();
              onEdit?.(destination);
            }}
          >
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        {cover ? (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <img
              src={cover}
              alt={destination.name}
              className="aspect-[21/9] w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex aspect-[21/9] w-full items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-gray-400">
            <MapPin className="h-8 w-8" />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={CATEGORY_TONES[destination.category] || "gray"}>
            {categoryLabel}
          </Badge>
          {destination.status && <Badge tone="gray">{destination.status}</Badge>}
          {destination.verificationStatus && (
            <Badge tone="brand">{destination.verificationStatus}</Badge>
          )}
        </div>

        {destination.description && (
          <p className="text-sm leading-relaxed text-gray-700">{destination.description}</p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <DetailBlock label="Region / area">
            {locationParts.join(" · ") || "—"}
          </DetailBlock>
          <DetailBlock label="Coordinates">
            {hasCoords ? (
              <span className="inline-flex flex-wrap items-center gap-2">
                <span className="tabular-nums">
                  {Number(destination.latitude).toFixed(5)},{" "}
                  {Number(destination.longitude).toFixed(5)}
                </span>
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-brand-600 hover:text-brand-700"
                  >
                    Open map
                  </a>
                )}
              </span>
            ) : (
              "—"
            )}
          </DetailBlock>
        </div>

        <DetailBlock label="Historical information">
          {destination.historicalInfo}
        </DetailBlock>
        <DetailBlock label="Accessibility">{destination.accessibility}</DetailBlock>
        <DetailBlock label="Seasonal advice">{destination.seasonalInfo}</DetailBlock>

        {images.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Photos ({images.length})
            </p>
            <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {images.map((url, idx) => (
                <li
                  key={`${url}-${idx}`}
                  className="aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
