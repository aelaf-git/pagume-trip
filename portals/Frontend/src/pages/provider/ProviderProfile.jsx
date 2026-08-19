import { useState } from "react"
import { CheckCircle2, Clock, FileText } from "lucide-react"
import PageHeader from "../../components/common/PageHeader"
import Card from "../../components/common/Card"
import OnboardingStatusCard from "../../components/provider/OnboardingStatusCard"
import EditActionBar from "../../components/provider/EditActionBar"
import HotelGeneralInfoTab from "../../components/provider/hotel/HotelGeneralInfoTab"
import HotelAmenitiesTab from "../../components/provider/hotel/HotelAmenitiesTab"
import HotelPoliciesTab from "../../components/provider/hotel/HotelPoliciesTab"
import HotelMediaGalleryTab from "../../components/provider/hotel/HotelMediaGalleryTab"
import AgencyProfileView from "../../components/provider/agency/AgencyProfileView"
import TransportProfileView from "../../components/provider/transport/TransportProfileView"
import DriverProfileView from "../../components/provider/driver/DriverProfileView"
import { useProviderProfile } from "../../contexts/ProviderProfileContext"
import { ProfileSkeleton } from "../../components/common/LoadingSkeleton"
import { PROVIDER_CATEGORIES } from "../../constants/providerCategories"
import { DOCUMENT_REQUIREMENTS } from "../../constants/documentRequirements"
import { validateHotelProfile } from "../../utils/hotelProfileValidation"
import { validateTransportProfile } from "../../utils/transportProfileValidation"
import { validateDriverProfile } from "../../utils/driverProfileValidation"

const HOTEL_TABS = [
  { key: "general", label: "General Info" },
  { key: "amenities", label: "Amenities & Features" },
  { key: "policies", label: "Policies & Rules" },
  { key: "media", label: "Media Gallery" },
]

function formatValue(value) {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—"
  if (typeof value === "boolean") return value ? "Yes" : "No"
  return value || "—"
}

function humanizeFieldName(name) {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim()
}

function DocumentsCard({ providerType, documents }) {
  return (
    <Card title="Uploaded Documents">
      <ul className="divide-y divide-gray-100">
        {(DOCUMENT_REQUIREMENTS[providerType] || []).map((doc) => {
          const uploaded = documents[doc.key]?.status === "success"
          return (
            <li key={doc.key} className="flex items-center justify-between py-2.5 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{doc.label}</span>
                {!doc.required && (
                  <span className="text-xs text-gray-400">(optional)</span>
                )}
              </div>
              {uploaded ? (
                <span className="flex items-center gap-1.5 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="truncate max-w-[180px]">{documents[doc.key].name}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-500">
                  <Clock className="h-4 w-4" /> Not uploaded
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

function ProfileView({ profileData, providerType, documents, updatedAt }) {
  const config = PROVIDER_CATEGORIES[providerType]
  if (!config) return null
  const fieldEntries = [...(config.requiredFields || []), ...(config.requiredArrayFields || [])]

  return (
    <div className="space-y-6">
      <Card title={`${config.label} Details`}>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fieldEntries.map((field) => (
            <div key={field}>
              <dt className="text-xs text-gray-400 uppercase tracking-wide">{humanizeFieldName(field)}</dt>
              <dd className="text-sm text-gray-800 mt-0.5">{formatValue(profileData[field])}</dd>
            </div>
          ))}
        </dl>
        {updatedAt && (
          <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
            Last updated: {new Date(updatedAt).toLocaleDateString()}
          </p>
        )}
      </Card>

      <DocumentsCard providerType={providerType} documents={documents} />
    </div>
  )
}

function HotelProfileView({ profile, editData, setEditData, isEditing }) {
  const [activeTab, setActiveTab] = useState("general")
  const data = isEditing ? editData : (profile?.profileData || {})

  const handleFieldChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }))
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <HotelGeneralInfoTab
            data={data}
            errors={tabErrors}
            onChange={handleFieldChange}
            isEditing={isEditing}
          />
        )
      case "amenities":
        return (
          <HotelAmenitiesTab
            data={data}
            isEditing={isEditing}
            onChange={handleFieldChange}
          />
        )
      case "policies":
        return (
          <HotelPoliciesTab
            data={data}
            errors={tabErrors}
            onChange={handleFieldChange}
            isEditing={isEditing}
          />
        )
      case "media":
        return (
          <HotelMediaGalleryTab
            data={data}
            isEditing={isEditing}
            onChange={handleFieldChange}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="border-b border-gray-200 -mx-6 px-6">
          <nav className="flex gap-0 overflow-x-auto" aria-label="Profile tabs">
            {HOTEL_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-brand-500 text-brand-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="pt-5">{renderTabContent()}</div>
      </Card>

      {profile.updatedAt && (
        <p className="text-xs text-gray-400 text-right">
          Last updated: {new Date(profile.updatedAt).toLocaleDateString()}
        </p>
      )}

      <DocumentsCard providerType="hotel" documents={profile.documents} />
    </div>
  )
}

function ProfileContent() {
  const {
    profile,
    providerType,
    loading,
    saving,
    error,
    isEditing,
    notice,
    updateProfileData,
    setEditing,
  } = useProviderProfile()

  const [editData, setEditData] = useState(null)
  const [tabErrors, setTabErrors] = useState({})

  const isHotel = providerType === "hotel"
  const isAgency = providerType === "agency"
  const isTransport = providerType === "transport"
  const isDriver = providerType === "driver"

  const handleEdit = () => {
    setEditData(profile?.profileData ? { ...profile.profileData } : {})
    setTabErrors({})
    setEditing(true)
  }

  const handleCancel = () => {
    setEditData(null)
    setTabErrors({})
    setEditing(false)
  }

  const handleSave = async () => {
    if (!editData) return

    if (isHotel) {
      const errors = validateHotelProfile(editData)
      if (Object.keys(errors).length > 0) {
        setTabErrors(errors)
        return
      }
    }

    if (isTransport) {
      const errors = validateTransportProfile(editData)
      if (Object.keys(errors).length > 0) {
        setTabErrors(errors)
        return
      }
    }

    if (isDriver) {
      const errors = validateDriverProfile(editData)
      if (Object.keys(errors).length > 0) {
        setTabErrors(errors)
        return
      }
    }

    setTabErrors({})
    await updateProfileData({ profileData: editData })
    setEditData(null)
  }

  const handleFieldChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }))
    if (tabErrors[field]) {
      setTabErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const hasChanges = isEditing && editData && profile?.profileData &&
    JSON.stringify(editData) !== JSON.stringify(profile.profileData)

  if (loading) {
    return <ProfileSkeleton />
  }

  if (error && !profile) {
    return (
      <div>
        <PageHeader title="Profile & Settings" description="View and manage your provider profile" />
        <Card>
          <div className="py-12 text-center text-red-500">{error}</div>
        </Card>
      </div>
    )
  }

  if (!profile) {
    return (
      <div>
        <PageHeader title="Profile & Settings" description="View and manage your provider profile" />
        <Card>
          <div className="py-12 text-center text-gray-400">No profile data found.</div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profile & Settings" description="View and manage your provider profile" />

      {profile.verificationStatus && (
        <OnboardingStatusCard
          status={profile.verificationStatus}
          reviewNotes={null}
          submittedAt={profile.submittedAt}
        />
      )}

      {isHotel ? (
        <HotelProfileView
          profile={profile}
          editData={editData}
          setEditData={setEditData}
          isEditing={isEditing}
        />
      ) : isAgency ? (
        <Card>
          <AgencyProfileView
            profileData={profile.profileData}
            editData={editData}
            isEditing={isEditing}
            onChange={handleFieldChange}
            errors={tabErrors}
          />
        </Card>
      ) : isTransport ? (
        <TransportProfileView
          profileData={isEditing ? editData : profile.profileData}
          documents={profile.documents}
          isEditing={isEditing}
          onChange={handleFieldChange}
          errors={tabErrors}
          updatedAt={profile.updatedAt}
        />
      ) : isDriver ? (
        <Card>
          <DriverProfileView
            profileData={isEditing ? editData : profile.profileData}
            verificationDocuments={profile.verificationDocuments}
            isEditing={isEditing}
            onChange={handleFieldChange}
            errors={tabErrors}
          />
        </Card>
      ) : isEditing && editData ? (
        <div className="space-y-6">
          {(() => {
            const config = PROVIDER_CATEGORIES[providerType]
            if (!config) return null
            const FieldsComponent = config.FieldsComponent
            return (
              <Card title={`Edit ${config.label} Details`}>
                <FieldsComponent
                  data={editData}
                  errors={{}}
                  onChange={handleFieldChange}
                />
              </Card>
            )
          })()}

          <DocumentsCard providerType={providerType} documents={profile.documents} />
        </div>
      ) : (
        <ProfileView
          profileData={profile.profileData}
          providerType={providerType}
          documents={profile.documents}
          verificationStatus={profile.verificationStatus}
          updatedAt={profile.updatedAt}
        />
      )}

      <EditActionBar
        isEditing={isEditing}
        saving={saving}
        hasChanges={hasChanges}
        onEdit={handleEdit}
        onSave={handleSave}
        onCancel={handleCancel}
        notice={notice}
      />
    </div>
  )
}

export default function ProviderProfile() {
  return <ProfileContent />
}
