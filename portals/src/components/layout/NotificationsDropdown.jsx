import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { getNotifications, markRead } from "../../services/notificationService";

export default function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const ref = useRef(null);

  const load = () => {
    getNotifications()
      .then(setItems)
      .catch(() => setItems([]));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unread = items.filter((n) => !n.read).length;

  const onOpen = async () => {
    setOpen((o) => !o);
  };

  const onClickItem = async (n) => {
    if (!n.read) {
      try {
        await markRead(n.id);
        await load();
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={onOpen}
        className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-lg border border-gray-100 bg-white shadow-lg">
          <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold">
            Notifications
          </div>
          <ul className="max-h-64 divide-y divide-gray-100 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-4 py-3 text-sm text-gray-500">No notifications</li>
            ) : (
              items.map((n) => (
                <li
                  key={n.id}
                  className={`cursor-pointer px-4 py-3 text-sm hover:bg-gray-50 ${
                    n.read ? "" : "bg-brand-50/40"
                  }`}
                  onClick={() => onClickItem(n)}
                >
                  <p className="text-gray-800">{n.title}</p>
                  {n.body && <p className="mt-0.5 text-xs text-gray-500">{n.body}</p>}
                  <p className="mt-0.5 text-xs text-gray-400">{n.time}</p>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
