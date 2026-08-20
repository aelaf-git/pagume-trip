import { useState, useEffect, useRef } from "react"
import { LayoutGrid } from "lucide-react"
import PageHeader from "../common/PageHeader"
import Button from "../common/Button"
import PackageDashboard from "./agency/PackageDashboard"
import PackageWizard from "./agency/PackageWizard"
import * as inventoryService from "../../services/inventoryService"

export default function TourPackageBuilder() {
  const [mode, setMode] = useState("dashboard")
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState(null)
  const noticeTimer = useRef(null)

  const showNotice = (msg) => {
    setNotice(msg)
    clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNotice(null), 3000)
  }

  useEffect(() => () => clearTimeout(noticeTimer.current), [])

  const handleCreateNew = () => {
    setEditing(null)
    setMode("wizard")
  }

  const handleEditExisting = (pkg) => {
    setEditing(pkg)
    setMode("wizard")
  }

  const handleSave = async (payload) => {
    setSaving(true)
    try {
      if (editing) {
        await inventoryService.updatePackage(editing.id, payload)
        showNotice("Package updated successfully.")
      } else {
        await inventoryService.createPackage(payload)
        showNotice("Package created successfully.")
      }
      setMode("dashboard")
      setEditing(null)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setMode("dashboard")
    setEditing(null)
  }

  if (mode === "wizard") {
    return (
      <div>
        <PageHeader
          title={editing ? `Edit: ${editing.name}` : "New Tour Package"}
          description={editing ? "Update package details below." : "Use the wizard to create a new tour package."}
          action={
            <Button variant="outline" onClick={handleCancel}>
              <LayoutGrid className="h-4 w-4" /> Back to Packages
            </Button>
          }
        />
        {notice && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 mb-4">{notice}</div>
        )}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <PackageWizard editing={editing} onSave={handleSave} onCancel={handleCancel} />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Tour Packages" description="Create, manage and monitor your tour package catalog" />
      {notice && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 mb-4">{notice}</div>
      )}
      <PackageDashboard onEditNew={handleCreateNew} onEditExisting={handleEditExisting} />
    </div>
  )
}
