import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, CalendarDays, DollarSign, AlertTriangle } from "lucide-react"
import Card from "../common/Card"
import Button from "../common/Button"
import Select from "../common/Select"
import Input from "../common/Input"

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function dateKey(d) {
  return d.toISOString().slice(0, 10)
}

function addDays(d, n) {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function formatDateShort(d) {
  return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`
}

const CELL_STATUS = {
  available: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100",
  blocked: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100",
  reserved: "bg-amber-50 text-amber-700 border-amber-200 cursor-default",
}

const STATUS_LABEL = { available: "Avail", blocked: "Blocked", reserved: "Booked" }

const ADJUSTMENT_TYPES = [
  { value: "percentage", label: "Percentage (%)" },
  { value: "flat", label: "Flat amount (ETB)" },
]

export default function HotelAvailabilityGrid({ calendarData, onToggle, onBulkAdjust, loading }) {
  const [offset, setOffset] = useState(0)
  const [notice, setNotice] = useState(null)
  const noticeTimer = useRef(null)

  const [bulkStart, setBulkStart] = useState("")
  const [bulkEnd, setBulkEnd] = useState("")
  const [bulkType, setBulkType] = useState("percentage")
  const [bulkValue, setBulkValue] = useState("")
  const [bulkRoom, setBulkRoom] = useState("all")
  const [bulkApplying, setBulkApplying] = useState(false)

  const showNotice = (msg) => {
    setNotice(msg)
    clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNotice(null), 3000)
  }

  useEffect(() => () => clearTimeout(noticeTimer.current), [])

  const DAYS_COUNT = 14
  const startDate = addDays(new Date(2026, 7, 18), offset)
  const dates = Array.from({ length: DAYS_COUNT }, (_, i) => addDays(startDate, i))

  const todayKey = "2026-08-18"

  const handleApplyBulk = async () => {
    if (!bulkStart || !bulkEnd || !bulkValue) return
    const roomIds = bulkRoom === "all"
      ? calendarData.map((r) => r.id)
      : [bulkRoom]
    const value = Number(bulkValue)
    if (Number.isNaN(value) || value === 0) return

    setBulkApplying(true)
    try {
      await onBulkAdjust(roomIds, bulkStart, bulkEnd, { type: bulkType, value })
      showNotice(`Price adjustment applied to ${roomIds.length} room${roomIds.length === 1 ? "" : "s"}.`)
    } finally {
      setBulkApplying(false)
    }
  }

  const roomOptions = [
    { value: "all", label: "All rooms" },
    ...calendarData.map((r) => ({ value: r.id, label: r.label })),
  ]

  if (loading) {
    return (
      <Card>
        <div className="py-12 text-center text-sm text-gray-400">Loading calendar…</div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {notice && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          {notice}
        </div>
      )}

      <Card title="Bulk Price Adjustment">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <Input
            id="bulk-start"
            label="Start date"
            type="date"
            value={bulkStart}
            onChange={(e) => setBulkStart(e.target.value)}
          />
          <Input
            id="bulk-end"
            label="End date"
            type="date"
            value={bulkEnd}
            onChange={(e) => setBulkEnd(e.target.value)}
          />
          <Select
            id="bulk-type"
            label="Adjustment"
            options={ADJUSTMENT_TYPES}
            value={bulkType}
            onChange={(e) => setBulkType(e.target.value)}
          />
          <Input
            id="bulk-value"
            label={bulkType === "percentage" ? "Surcharge %" : "Surcharge amount"}
            type="number"
            min="0"
            placeholder={bulkType === "percentage" ? "e.g. 25" : "e.g. 2000"}
            value={bulkValue}
            onChange={(e) => setBulkValue(e.target.value)}
          />
          <div className="flex items-end gap-2">
            <Select
              id="bulk-room"
              label="Apply to"
              options={roomOptions}
              value={bulkRoom}
              onChange={(e) => setBulkRoom(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            Adjustments apply to available dates only. Reserved and blocked dates are untouched.
          </p>
          <Button
            size="sm"
            loading={bulkApplying}
            disabled={!bulkStart || !bulkEnd || !bulkValue}
            onClick={handleApplyBulk}
          >
            Apply Adjustment
          </Button>
        </div>
      </Card>

      <Card
        title="Availability Calendar"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setOffset((o) => o - DAYS_COUNT)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-gray-500 min-w-[120px] text-center">
              {formatDateShort(dates[0])} – {formatDateShort(dates[dates.length - 1])}
            </span>
            <Button variant="outline" size="sm" onClick={() => setOffset((o) => o + DAYS_COUNT)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      >
        <div className="flex items-center gap-4 mb-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-green-200 border border-green-300" />
            Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-amber-200 border border-amber-300" />
            Reserved
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-red-200 border border-red-300" />
            Blocked
          </span>
          <span className="flex items-center gap-1 ml-auto text-gray-400">
            <AlertTriangle className="h-3 w-3" />
            Click a cell to toggle between Available ↔ Blocked
          </span>
        </div>

        {calendarData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No rooms to display.</p>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-left text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-white pb-2 pr-3 font-medium text-gray-500 min-w-[140px]">
                    Room
                  </th>
                  {dates.map((d) => {
                    const dk = dateKey(d)
                    const isToday = dk === todayKey
                    return (
                      <th
                        key={dk}
                        className={`pb-2 px-1 font-medium text-center whitespace-nowrap min-w-[4rem] ${isToday ? "text-brand-600" : "text-gray-400"}`}
                      >
                        <div>{DAY_NAMES[d.getDay()]}</div>
                        <div className="text-[10px]">{formatDateShort(d)}</div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {calendarData.map((room) => (
                  <tr key={room.id} className="border-t border-gray-100">
                    <td className="sticky left-0 z-10 bg-white py-2 pr-3">
                      <p className="font-medium text-gray-800 text-xs">{room.label}</p>
                    </td>
                    {dates.map((d) => {
                      const dk = dateKey(d)
                      const status = room.dates?.[dk] ?? "available"
                      const price = room.prices?.[dk]
                      const isBlocked = status === "blocked"
                      const isReserved = status === "reserved"
                      const baseForRoom = Object.values(room.prices || {}).find((v) => v != null) ?? 0
                      const isSurcharge = price != null && price > baseForRoom && status === "available"

                      const colorClass = CELL_STATUS[status] ?? CELL_STATUS.available

                      return (
                        <td key={dk} className="py-2 px-1">
                          <button
                            type="button"
                            disabled={isReserved}
                            onClick={() => onToggle(room.id, dk)}
                            className={`min-h-[3.25rem] w-full rounded-lg border px-1.5 py-1 text-left transition-colors ${colorClass} ${isReserved ? "" : "cursor-pointer"}`}
                            title={
                              isReserved
                                ? "Reserved — cannot modify"
                                : isBlocked
                                  ? "Click to make available"
                                  : `Click to block · ETB ${(price ?? 0).toLocaleString()}`
                            }
                          >
                            <span className="block text-[10px] font-medium leading-tight">
                              {STATUS_LABEL[status]}
                            </span>
                            {price != null && (
                              <span
                                className={`block text-[10px] leading-tight mt-0.5 ${
                                  isSurcharge ? "text-blue-600 font-bold" : ""
                                } ${isBlocked ? "line-through opacity-50" : ""}`}
                              >
                                {price.toLocaleString()}
                              </span>
                            )}
                          </button>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
