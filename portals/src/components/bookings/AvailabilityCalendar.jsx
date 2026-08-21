import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import Card from "../common/Card";
import Badge from "../common/Badge";
import Button from "../common/Button";
import { CALENDAR_STATUS_COLORS } from "../../constants/bookingOptions";
import * as bookingService from "../../services/bookingService";

function dateKey(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(d, n) {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDateShort(d) {
  return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`;
}

function StatusCell({ status, onClick }) {
  const colorClass = CALENDAR_STATUS_COLORS[status] ?? "bg-gray-50 text-gray-500 border-gray-200";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[2.25rem] w-full rounded-lg border px-1 py-1 text-xs font-medium transition-colors cursor-pointer ${colorClass}`}
      title={`Click to toggle — currently ${status}`}
    >
      {status === "available" && "Available"}
      {status === "blocked" && "Blocked"}
      {status === "reserved" && "Reserved"}
    </button>
  );
}

function SeatsCell({ status, onClick }) {
  const seats = status === "reserved" ? "Full" : status === "blocked" ? "—" : "Open";
  const tone = status === "available" ? "green" : status === "reserved" ? "amber" : "gray";
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[2.25rem] w-full cursor-pointer"
    >
      <Badge tone={tone}>{seats}</Badge>
    </button>
  );
}

function DriverTimeline({ ranges }) {
  const startDate = new Date(2026, 7, 18);
  const totalDays = 14;
  const end = addDays(startDate, totalDays);

  function rangePercent(rangeStart, rangeEnd) {
    const rStart = new Date(rangeStart);
    const rEnd = new Date(rangeEnd);
    const total = end - startDate;
    const left = Math.max(0, (rStart - startDate) / total) * 100;
    const width = Math.min(100 - left, ((rEnd - rStart) / total) * 100);
    return { left: `${left}%`, width: `${width}%` };
  }

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <CalendarDays className="h-4 w-4 text-gray-400" />
        <p className="text-sm font-medium text-gray-700">Availability Ranges</p>
      </div>
      <div className="space-y-3">
        {ranges.length === 0 ? (
          <p className="text-sm text-gray-400">No availability ranges defined.</p>
        ) : (
          ranges.map((range) => {
            const { left, width } = rangePercent(range.startDate, range.endDate);
            return (
              <div key={range.id} className="space-y-1">
                <p className="text-xs text-gray-500">
                  {range.startDate} → {range.endDate}
                </p>
                <div className="relative h-6 rounded bg-gray-100">
                  <div
                    className="absolute top-0 h-full rounded bg-brand-500/20 border border-brand-400"
                    style={{ left, width }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

export default function AvailabilityCalendar() {
  const { user } = useAuth();
  const providerType = user?.providerType;
  const [calendarData, setCalendarData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [notice, setNotice] = useState(null);
  const noticeTimer = useRef(null);

  const showNotice = (message) => {
    setNotice(message);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3000);
  };

  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  const loadCalendar = useCallback(async () => {
    const data = await bookingService.getAvailabilityCalendar(providerType);
    setCalendarData(data);
    setLoading(false);
  }, [providerType]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  const startDate = addDays(new Date(2026, 7, 18), offset);
  const DAYS_COUNT = 14;
  const dates = Array.from({ length: DAYS_COUNT }, (_, i) => addDays(startDate, i));

  const handleToggle = async (itemId, date) => {
    await bookingService.toggleAvailability(providerType, itemId, date);
    setCalendarData((prev) =>
      prev.map((item) => {
        if (item.id !== itemId || !item.dates) return item;
        const current = item.dates[date];
        const next = current === "available" ? "blocked" : current === "blocked" ? "available" : current;
        return { ...item, dates: { ...item.dates, [date]: next } };
      })
    );
    showNotice("Availability updated.");
  };

  if (loading) {
    return (
      <Card>
        <div className="py-12 text-center text-sm text-gray-400">Loading calendar…</div>
      </Card>
    );
  }

  if (providerType === "driver") {
    return (
      <div className="space-y-4">
        {notice && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            {notice}
          </div>
        )}
        <DriverTimeline ranges={calendarData} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notice && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {notice}
        </div>
      )}

      <Card
        title="Availability"
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
        {calendarData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No inventory items to show on the calendar.</p>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="w-full text-left text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-white pb-2 pr-3 font-medium text-gray-500 min-w-[120px]">
                    Item
                  </th>
                  {dates.map((d) => {
                    const isToday = dateKey(d) === "2026-08-18";
                    return (
                      <th
                        key={dateKey(d)}
                        className={`pb-2 px-1 font-medium text-center whitespace-nowrap ${isToday ? "text-brand-600" : "text-gray-400"}`}
                      >
                        <div>{DAY_NAMES[d.getDay()]}</div>
                        <div className="text-[10px]">{formatDateShort(d)}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {calendarData.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="sticky left-0 z-10 bg-white py-2 pr-3 font-medium text-gray-800 text-xs">
                      {item.label}
                    </td>
                    {dates.map((d) => {
                      const key = dateKey(d);
                      const status = item.dates?.[key] ?? "available";
                      return (
                        <td key={key} className="py-2 px-1">
                          {providerType === "agency" ? (
                            <SeatsCell
                              status={status}
                              onClick={() => handleToggle(item.id, key)}
                            />
                          ) : (
                            <StatusCell
                              status={status}
                              onClick={() => handleToggle(item.id, key)}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
