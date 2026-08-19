import { useState } from "react"
import { Outlet } from "react-router-dom"
import Sidebar from "../components/layout/Sidebar"
import Header from "../components/layout/Header"
import ErrorBoundary from "../components/common/ErrorBoundary"
import { PageSkeleton } from "../components/common/LoadingSkeleton"
import { ProviderProfileProvider, useProviderProfile } from "../contexts/ProviderProfileContext"
import { providerNavItems } from "../constants/navigation"

function LayoutShell() {
  const [collapsed, setCollapsed] = useState(false)
  const { loading, error } = useProviderProfile()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        navItems={providerNavItems}
        portalName="Provider"
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header portalName="Provider" />
        <main className="flex-1 p-6">
          <ErrorBoundary sectionName="Provider workspace">
            {loading ? (
              <PageSkeleton />
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                <p className="text-sm text-red-500">{error}</p>
                <p className="text-xs text-gray-400">Please refresh the page to try again.</p>
              </div>
            ) : (
              <Outlet />
            )}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}

export default function ProviderLayout() {
  return (
    <ErrorBoundary sectionName="Provider portal">
      <ProviderProfileProvider>
        <LayoutShell />
      </ProviderProfileProvider>
    </ErrorBoundary>
  )
}

