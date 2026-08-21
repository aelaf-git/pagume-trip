import { Outlet, Link } from "react-router-dom";
import BrandLogo from "../components/common/BrandLogo";
import { marketplaceNavItems } from "../constants/navigation";

export default function MarketplaceLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/marketplace" className="flex items-center">
            <BrandLogo size="sm" wordmark="Pagume Trip" wordmarkClassName="text-gray-900" />
          </Link>
          <nav className="flex flex-wrap gap-3 text-sm">
            {marketplaceNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-gray-600 hover:text-brand-600"
              >
                {item.label}
              </Link>
            ))}
            <Link to="/login" className="font-medium text-brand-600">
              Provider login
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
