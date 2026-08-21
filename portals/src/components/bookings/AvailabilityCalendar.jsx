import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import Card from "../common/Card";
import Badge from "../common/Badge";
import Button from "../common/Button";
import {
  CALENDAR_STATUS_COLORS,
  CALENDAR_STATUS_OPTIONS,
} from "../../constants/bookingOptions";
import * as bookingService from "../../services/bookingService";

function dateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d, n) {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MENU_EST_HEIGHT = 200;
const MENU_WIDTH = 144; // w-36

function formatDateShort(d) {
  return `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`;
}

function statusLabel(status) {
  return (
    CALENDAR_STATUS_OPTIONS.find((o) => o.value === status)?.label ||
    status ||
    "Available"
  );
}

/** Portal menu so overflow-x-auto on the calendar table does not clip it. */
function StatusMenuPortal({ open, anchorRef, menuRef, children }) {
  const [style, setStyle] = useState(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) {
      setStyle(null);
      return undefined;
    }

    function place() {
      const rect = anchorRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < MENU_EST_HEIGHT && rect.top > MENU_EST_HEIGHT;
      let left = rect.left + rect.width / 2 - MENU_WIDTH / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - MENU_WIDTH - 8));
      setStyle({
        position: "fixed",
        top: openUp ? rect.top - 4 : rect.bottom + 4,
        left,
        width: MENU_WIDTH,
        transform: openUp ? "translateY(-100%)" : undefined,
        zIndex: 60,
      });
    }

    place();
    window.addEventListener("resize", place);
    // capture scroll from overflow containers
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, anchorRef]);

  if (!open || !style) return null;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      style={style}
      className="rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
    >
      {children}
    </div>,
    document.body
  );
}

function StatusCell({ status, open, onOpen, onSelect, onClose, menuRef }) {
  const anchorRef = useRef(null);
  const colorClass =
    CALENDAR_STATUS_COLORS[status] ?? "bg-gray-50 text-gray-500 border-gray-200";

  return (
    <div className="relative">
      <button
        ref={anchorRef}
        type="button"
        onClick={onOpen}
        className={`min-h-[2.25rem] w-full rounded-lg border px-1 py-1 text-xs font-medium transition-colors cursor-pointer ${colorClass}`}
        title="Click to change availability"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {statusLabel(status)}
      </button>
      <StatusMenuPortal open={open} anchorRef={anchorRef} menuRef={menuRef}>
        <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
          Set status
        </p>
        {CALENDAR_STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="menuitem"
            disabled={opt.value === status}
            onClick={() => onSelect(opt.value)}
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-gray-50 disabled:opacity-40 ${
              opt.value === status ? "font-semibold text-brand-700" : "text-gray-700"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full border ${CALENDAR_STATUS_COLORS[opt.value] || ""}`}
            />
            {opt.label}
          </button>
        ))}
        <button
          type="button"
          className="mt-1 w-full border-t border-gray-100 px-3 py-1.5 text-left text-xs text-gray-400 hover:bg-gray-50"
          onClick={onClose}
        >
          Cancel
        </button>
      </StatusMenuPortal>
    </div>
  );
}

function SeatsCell({ status, open, onOpen, onSelect, onClose, menuRef }) {
  const anchorRef = useRef(null);
  const seats =
    status === "booked" || status === "reserved"
      ? "Full"
      : status === "blocked"
        ? "—"
        : "Open";
  const tone =
    status === "available"
      ? "green"
      : status === "booked" || status === "reserved"
        ? "amber"
        : "gray";

  return (
    <div className="relative">
      <button
        ref={anchorRef}
        type="button"
        onClick={onOpen}
        className="min-h-[2.25rem] w-full cursor-pointer"
        title="Click to change availability"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Badge tone={tone}>{seats}</Badge>
      </button>
      <StatusMenuPortal open={open} anchorRef={anchorRef} menuRef={menuRef}>
        {CALENDAR_STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="menuitem"
            onClick={() => onSelect(opt.value)}
            className="flex w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50"
          >
            {opt.label}
          </button>
        ))}
        <button
          type="button"
          className="w-full border-t border-gray-100 px-3 py-1.5 text-left text-xs text-gray-400"
          onClick={onClose}
        >
          Cancel
        </button>
      </StatusMenuPortal>
    </div>
  );
}

function DriverTimeline({ ranges }) {
  const startDate = startOfToday();
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
      <div className="mb-4 flex items-center gap-2">
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
                    className="absolute top-0 h-full rounded border border-brand-400 bg-brand-500/20"
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
  const [saving, setSaving] = useState(false);
  const [offset, setOffset] = useState(0);
  const [notice, setNotice] = useState(null);
  const [picker, setPicker] = useState(null); // { itemId, date }
  const noticeTimer = useRef(null);
  const menuRef = useRef(null);

  const showNotice = (message) => {
    setNotice(message);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3000);
  };

  useEffect(() => () => clearTimeout(noticeTimer.current), []);

  useEffect(() => {
    if (!picker) return;
    function handleClickOutside(e) {
      const inMenu = menuRef.current?.contains(e.target);
      const onTrigger = e.target.closest?.('[aria-haspopup="menu"]');
      if (!inMenu && !onTrigger) {
        setPicker(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [picker]);

  const loadCalendar = useCallback(async () => {
    try {
      const data = await bookingService.getAvailabilityCalendar(providerType);
      setCalendarData(data);
    } catch {
      setCalendarData([]);
    } finally {
      setLoading(false);
    }
  }, [providerType]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  const startDate = addDays(startOfToday(), offset);
  const DAYS_COUNT = 14;
  const dates = Array.from({ length: DAYS_COUNT }, (_, i) => addDays(startDate, i));
  const todayKey = dateKey(startOfToday());

  const handleSelectStatus = async (itemId, date, status) => {
    setSaving(true);
    setPicker(null);
    try {
      const updated = await bookingService.setAvailabilityStatus(
        providerType,
        itemId,
        date,
        status
      );
      if (updated) {
        setCalendarData((prev) =>
          prev.map((item) => (String(item.id) === String(itemId) ? updated : item))
        );
      } else {
        await loadCalendar();
      }
      showNotice(`Marked ${date} as ${statusLabel(status)}.`);
    } catch (e) {
      showNotice(e.message || "Could not update availability.");
    } finally {
      setSaving(false);
    }
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
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
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
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {notice}
        </div>
      )}

      <Card
        title="Availability"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset((o) => o - DAYS_COUNT)}
              disabled={saving}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[120px] text-center text-xs text-gray-500">
              {formatDateShort(dates[0])} – {formatDateShort(dates[dates.length - 1])}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset((o) => o + DAYS_COUNT)}
              disabled={saving}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      >
        <p className="mb-3 text-xs text-gray-500">
          Click a day to set it as Available, Booked, Reserved, or Blocked. Changes save to the
          database.
        </p>
        <div className="mb-4 flex flex-wrap gap-3 text-xs text-gray-500">
          {CALENDAR_STATUS_OPTIONS.map((opt) => (
            <span key={opt.value} className="inline-flex items-center gap-1.5">
              <span
                className={`inline-block h-3 w-3 rounded border ${CALENDAR_STATUS_COLORS[opt.value]}`}
              />
              {opt.label}
            </span>
          ))}
        </div>

        {calendarData.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            No inventory items to show on the calendar.
          </p>
        ) : (
          <div className="-mx-5 overflow-x-auto px-5">
            <table className="w-full text-left text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 min-w-[120px] bg-white pb-2 pr-3 font-medium text-gray-500">
                    Item
                  </th>
                  {dates.map((d) => {
                    const key = dateKey(d);
                    const isToday = key === todayKey;
                    return (
                      <th
                        key={key}
                        className={`whitespace-nowrap px-1 pb-2 text-center font-medium ${
                          isToday ? "text-brand-600" : "text-gray-400"
                        }`}
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
                    <td className="sticky left-0 z-10 bg-white py-2 pr-3 text-xs font-medium text-gray-800">
                      {item.label}
                    </td>
                    {dates.map((d) => {
                      const key = dateKey(d);
                      const status = item.dates?.[key] ?? "available";
                      const isOpen =
                        picker?.itemId === String(item.id) && picker?.date === key;
                      const cellProps = {
                        status,
                        open: isOpen,
                        menuRef,
                        onOpen: () =>
                          setPicker(
                            isOpen
                              ? null
                              : { itemId: String(item.id), date: key }
                          ),
                        onClose: () => setPicker(null),
                        onSelect: (next) =>
                          handleSelectStatus(item.id, key, next),
                      };
                      return (
                        <td key={key} className="px-1 py-2">
                          {providerType === "agency" ? (
                            <SeatsCell {...cellProps} />
                          ) : (
                            <StatusCell {...cellProps} />
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
