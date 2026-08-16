import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";

const MOCK_NOTIFICATIONS = [
  { id: 1, title: "New booking received", time: "5m ago" },
  { id: 2, title: "Payout processed", time: "2h ago" },
  { id: 3, title: "Document verification needed", time: "1d ago" },
];

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-full hover:bg-gray-100 text-gray-600"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {MOCK_NOTIFICATIONS.length > 0 && (
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
          <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm">
            Notifications
          </div>
          <ul className="max-h-64 overflow-y-auto divide-y divide-gray-100">
            {MOCK_NOTIFICATIONS.map((n) => (
              <li key={n.id} className="px-4 py-3 text-sm hover:bg-gray-50 cursor-pointer">
                <p className="text-gray-800">{n.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

