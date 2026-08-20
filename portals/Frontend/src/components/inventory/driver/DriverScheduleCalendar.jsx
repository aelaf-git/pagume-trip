import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Card from "../../common/Card"
import Button from "../../common/Button"
import { DRIVER_CALENDAR_EVENT_TYPES } from "../../../constants/inventoryOptions"
import * as bookingService from "../../../services/bookingService"

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year, month) {
  return new Date(year, month, 1).getDay()
}

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}

const TODAY_KEY = "2026-08-18"

export default function DriverScheduleCalendar() {
  const [year, setYear] = useState(2026)
  const [month, setMonth] = useState(7)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const noticeTimer = useRef(null)

  const showNotice = (msg) => {
    setNotice(msg)
    clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNotice(null), 3000)
  }

  useEffect(() => () => clearTimeout(noticeTimer.current), [])

  const loadCalendar = useCallback(async () => {
    setLoading(true)
    const data = await bookingService.getDriverCalendar(year, month)
    setEvents(data)
    setLoading(false)
  }, [year, month])

  useEffect(() => { loadCalendar() }, [loadCalendar])

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1) }
    else setMonth(month - 1)
    setSelectedDay(null)
  }

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1) }
    else setMonth(month + 1)
    setSelectedDay(null)
  }

  const handleDayClick = async (day) => {
    const key = dateKey(year, month, day)
    const existing = events.find((e) => e.date === key)

    if (existing && existing.type === "booked") {
      setSelectedDay(key)
      return
    }

    if (existing && existing.type === "blocked") {
      setSelectedDay(key)
      return
    }

    const newType = existing?.type === "off" ? "available" : "off"
    await bookingService.toggleDriverDate(key, newType)
    setEvents((prev) => {
      if (newType === "available") {
        return prev.filter((e) => e.date !== key)
      }
      return [...prev.filter((e) => e.date !== key), { date: key, type: "off", label: "Personal Leave" }]
    })
    showNotice(newType === "off" ? "Marked as day off." : "Marked as available.")
    setSelectedDay(null)
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfWeek(year, month)
  const calendarDays = []

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d)
  }

  const eventMap = {}
  events.forEach((e) => { eventMap[e.date] = e })

  const selectedEvent = selectedDay ? eventMap[selectedDay] : null

  const stats = {
    booked: events.filter((e) => e.type === "booked").length,
    off: events.filter((e) => e.type === "off").length,
    blocked: events.filter((e) => e.type === "blocked").length,
    available: daysInMonth - events.length,
  }

  return (
    <div className="space-y-4">
      {notice && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{notice}</div>
      )}

      <Card>
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" size="sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-sm font-semibold text-gray-800">{MONTH_NAMES[month]} {year}</h3>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-3 text-xs text-gray-500 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" /> Booked ({stats.booked})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-400" /> Day Off ({stats.off})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" /> Blocked ({stats.blocked})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" /> Available ({stats.available})
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-400">Loading calendar...</div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
              {DAY_NAMES.map((day) => (
                <div key={day} className="bg-gray-50 py-2 text-center text-xs font-medium text-gray-500">
                  {day}
                </div>
              ))}
              {calendarDays.map((day, i) => {
                if (day === null) return <div key={`empty-${i}`} className="bg-white min-h-[4rem]" />

                const key = dateKey(year, month, day)
                const event = eventMap[key]
                const isToday = key === TODAY_KEY
                const isSelected = key === selectedDay
                const eventConfig = event ? DRIVER_CALENDAR_EVENT_TYPES[event.type] : null

                return (
                  <button key={key} type="button" onClick={() => handleDayClick(day)}
                    className={`bg-white min-h-[4rem] p-1.5 text-left transition-colors border-2 ${
                      isSelected ? "border-brand-500" :
                      isToday ? "border-brand-300" :
                      "border-transparent hover:bg-gray-50"
                    }`}>
                    <span className={`text-xs font-medium ${isToday ? "text-brand-600 font-bold" : "text-gray-700"}`}>
                      {day}
                    </span>
                    {event && (
                      <div className={`mt-1 rounded px-1.5 py-0.5 text-[10px] font-medium leading-tight ${eventConfig?.color || "bg-gray-100 text-gray-500"}`}>
                        <span className="hidden sm:inline">{event.type === "off" ? "Off" : event.type === "booked" ? "Booked" : event.type === "blocked" ? "Blocked" : ""}</span>
                        <span className="sm:hidden">{event.type === "off" ? "\u2022" : event.type === "booked" ? "\u25C6" : "\u2716"}</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            <p className="text-xs text-gray-400 mt-3 text-center">
              Click an empty day to mark as Off. Click an Off day to restore. Booked and Blocked days cannot be changed.
            </p>
          </>
        )}
      </Card>

      {selectedEvent && (
        <Card>
          <h4 className="text-sm font-semibold text-gray-800 mb-2">Event Details</h4>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-xs text-gray-400">Date</dt>
              <dd className="text-gray-800">{selectedEvent.date}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400">Type</dt>
              <dd className="text-gray-800 capitalize">{selectedEvent.type}</dd>
            </div>
            {selectedEvent.label && (
              <div className="col-span-2">
                <dt className="text-xs text-gray-400">Description</dt>
                <dd className="text-gray-800">{selectedEvent.label}</dd>
              </div>
            )}
          </dl>
        </Card>
      )}
    </div>
  )
}
