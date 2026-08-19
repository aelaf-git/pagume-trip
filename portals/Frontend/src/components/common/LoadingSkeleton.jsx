import Skeleton from "./Skeleton"

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading page">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <Skeleton className="h-5 w-40" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-64" />
      </div>
    </div>
  )
}

export function CardSkeleton({ rows = 3 }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-3 animate-pulse" aria-busy="true">
      <Skeleton className="h-5 w-40" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  )
}

export function TableSkeleton({ rowCount = 5, colCount = 4 }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden animate-pulse" aria-busy="true">
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="flex gap-8">
          {Array.from({ length: colCount }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-20" />
          ))}
        </div>
      </div>
      {Array.from({ length: rowCount }).map((_, row) => (
        <div key={row} className="px-6 py-4 border-b border-gray-100 last:border-0">
          <div className="flex gap-8">
            {Array.from({ length: colCount }).map((_, col) => (
              <Skeleton key={col} className="h-4 w-24" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading profile">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <div className="flex gap-4 border-b border-gray-200 pb-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading dashboard">
      <div className="space-y-2">
        <Skeleton className="h-7 w-72" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
        <div className="flex gap-3">
          <Skeleton className="h-5 w-5 rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-72" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white p-5 space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-48" />
      </div>
    </div>
  )
}
