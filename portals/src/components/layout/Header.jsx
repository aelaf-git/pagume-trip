import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, ChevronDown, User } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import NotificationsDropdown from "./NotificationsDropdown";

export default function Header({ portalName }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    const wasAdmin = user?.role === "ADMIN";
    await logout();
    navigate(wasAdmin ? "/admin/login" : "/login", { replace: true });
  };

  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40">
      <div>
        <h1 className="text-lg font-semibold text-gray-800">{portalName} Portal</h1>
      </div>

      <div className="flex items-center gap-4">
        <NotificationsDropdown />

        <div className="relative" ref={ref}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-gray-100"
          >
            <div className="h-8 w-8 rounded-full bg-brand-500 text-white flex items-center justify-center text-sm font-semibold">
              {initials || <User className="h-4 w-4" />}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-800 leading-tight">{user?.name}</p>
              <p className="text-xs text-gray-400 capitalize leading-tight">{user?.role}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

