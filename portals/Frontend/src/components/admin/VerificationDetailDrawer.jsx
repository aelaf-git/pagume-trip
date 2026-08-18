import { useEffect, useState } from "react"
import { X, ExternalLink, Download, CheckCircle2, Clock } from "lucide-react"
import Button from "../common/Button"
import Badge from "../common/Badge"
import { VERIFICATION_STATUSES } from "../../constants/verificationOptions"
import { PROVIDER_CATEGORIES } from "../../constants/providerCategories"
import { DOCUMENT_REQUIREMENTS } from "../../constants/documentRequirements"

function DocRow({ doc, requirement }) {
  const uploaded = doc?.status === "success"
  return (
    <div className="flex items-center justify-between py-2.5 text-sm border-b border-gray-50 last:border-0">
      <span className="text-gray-700">{requirement.label}</span>
      {uploaded ? (
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="truncate max-w-[180px]">{doc.name}</span>
          </span>
          <button className="text-brand-600 hover:text-brand-700 p-1" title="View">
            <ExternalLink className="h-4 w-4" />
          </button>
          <button className="text-brand-600 hover:text-brand-700 p-1" title="Download">
            <Download className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <span className="flex items-center gap-1 text-amber-500">
          <Clock className="h-4 w-4" /> Not uploaded
        </span>
      )}
    </div>
  )
}

function DetailSection({ title, children }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">{title}</h4>
      {children}
    </div>
  )
}

function DetailField({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="text-sm text-gray-800 mt-0.5">{value || "—"}</dd>
    </div>
  )
}

export default function VerificationDetailDrawer({ provider, onClose, onApprove, onReject, onRequestDocs, onSuspend }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (provider) {
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
    }
  }, [provider])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  if (!provider) return null

  const statusConfig = VERIFICATION_STATUSES[provider.status]
  const categoryConfig = PROVIDER_CATEGORIES[provider.category]
  const requirements = DOCUMENT_REQUIREMENTS[provider.category] || []
  const data = provider.registrationData || {}

  const renderRegistrationFields = () => {
    const fields = []
    const catData = data

    if (provider.category === "hotel") {
      fields.push(
        { label: "Hotel Name", value: catData.name },
        { label: "Business Type", value: catData.businessType },
        { label: "Address", value: catData.address },
        { label: "Coordinates", value: catData.latitude && catData.longitude ? `${catData.latitude}, ${catData.longitude}` : null },
        { label: "Contact", value: catData.contact },
        { label: "Star Rating", value: catData.starRating ? `${catData.starRating} Stars` : null },
        { label: "Check-in Time", value: catData.checkInTime },
        { label: "Check-out Time", value: catData.checkOutTime },
        { label: "Currency", value: catData.currency },
        { label: "Description", value: catData.description },
        { label: "Policies", value: catData.policies },
        { label: "Room Types", value: catData.roomTypes?.join(", ") },
        { label: "Amenities", value: catData.amenities?.join(", ") },
        { label: "Payment Methods", value: catData.paymentMethods?.join(", ") },
      )
    } else if (provider.category === "agency") {
      fields.push(
        { label: "Agency Name", value: catData.agencyName },
        { label: "Business Registration", value: catData.businessRegistration },
        { label: "Agency Type", value: catData.agencyType },
        { label: "Year Established", value: catData.yearEstablished },
        { label: "Currency", value: catData.currency },
        { label: "Specialties", value: catData.specialties?.join(", ") },
        { label: "Tour Types", value: catData.tourTypes?.join(", ") },
        { label: "Description", value: catData.description },
        { label: "Payment Methods", value: catData.paymentMethods?.join(", ") },
      )
    } else if (provider.category === "transport") {
      fields.push(
        { label: "Company Name", value: catData.companyName },
        { label: "Fleet Size", value: catData.fleetSize },
        { label: "Vehicle Types", value: catData.vehicleTypes?.join(", ") },
        { label: "Transmission", value: catData.transmission },
        { label: "Currency", value: catData.currency },
        { label: "Pickup Locations", value: catData.pickupLocations?.join(", ") },
        { label: "Drop-off Locations", value: catData.dropoffLocations?.join(", ") },
        { label: "Description", value: catData.description },
        { label: "Payment Methods", value: catData.paymentMethods?.join(", ") },
      )
    } else if (provider.category === "driver") {
      fields.push(
        { label: "Full Name", value: catData.fullName },
        { label: "License Number", value: catData.licenseNumber },
        { label: "License Expiry", value: catData.licenseExpiry },
        { label: "Experience Level", value: catData.experienceLevel },
        { label: "Languages", value: catData.languages?.join(", ") },
        { label: "Has Vehicle", value: catData.vehicleAvailable ? "Yes" : "No" },
        { label: "Bio", value: catData.bio },
      )
    }

    return fields
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={handleClose}
      />
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-xl transition-transform duration-300 ease-out flex flex-col ${visible ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{provider.businessName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge tone={statusConfig?.tone}>{statusConfig?.label}</Badge>
              <span className="text-sm text-gray-500">{categoryConfig?.label}</span>
            </div>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          <DetailSection title="Contact Information">
            <div className="grid grid-cols-2 gap-4">
              <DetailField label="Email" value={provider.email} />
              <DetailField label="Phone" value={provider.phone} />
              <DetailField label="Address" value={provider.address} />
              <DetailField label="Registered" value={new Date(provider.registeredAt).toLocaleDateString()} />
            </div>
          </DetailSection>

          {provider.rejectionReason && (
            <DetailSection title="Rejection Reason">
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                {provider.rejectionReason}
              </div>
            </DetailSection>
          )}

          {provider.statusNote && provider.status !== "VERIFIED" && (
            <DetailSection title="Status Note">
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
                {provider.statusNote}
              </div>
            </DetailSection>
          )}

          <DetailSection title="Registration Details">
            <div className="grid grid-cols-2 gap-4">
              {renderRegistrationFields().map((field) => (
                <DetailField key={field.label} label={field.label} value={field.value} />
              ))}
            </div>
          </DetailSection>

          <DetailSection title="Submitted Documents">
            <div>
              {requirements.map((req) => (
                <DocRow key={req.key} doc={provider.documents?.[req.key]} requirement={req} />
              ))}
            </div>
          </DetailSection>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex flex-wrap gap-3">
          {provider.status !== "VERIFIED" && (
            <Button variant="primary" onClick={onApprove}>Approve Verification</Button>
          )}
          {provider.status !== "REJECTED" && (
            <Button variant="danger" onClick={onReject}>Reject</Button>
          )}
          <Button variant="secondary" onClick={onRequestDocs}>Request Additional Documents</Button>
          {provider.status !== "SUSPENDED" && (
            <Button variant="outline" onClick={onSuspend}>Suspend Account</Button>
          )}
        </div>
      </div>
    </>
  )
}
