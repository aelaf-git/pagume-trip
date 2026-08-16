import { NavLink } from "react-router-dom";
import { ChevronsLeft, ChevronsRight, Compass } from "lucide-react";

export default function Sidebar({ navItems, portalName, collapsed, onToggle }) {
  return (
    <aside
      className={`h-screen sticky top-0 flex flex-col bg-gray-900 text-gray-200 transition-all duration-200 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between px-4 h-16 border-b border-gray-800">
        {!collapsed && (
          <div className="flex items-center gap-2 font-semibold text-white">
            <Compass className="h-6 w-6 text-brand-500" />
            <span className="truncate">Pagume {portalName}</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-gray-800 text-gray-400 hover:text-white"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
        {navItems.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`
            }
            title={collapsed ? label : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
