import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import { getAdminBookings } from "../../services/adminService";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAdminBookings()
      .then(setBookings)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings overview"
        description="All provider bookings in the portal database"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Card>
        {bookings.length === 0 ? (
          <p className="text-sm text-gray-500">No bookings yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {bookings.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900">{b.serviceName}</p>
                  <p className="text-gray-500">
                    {b.customerName} · {b.dates} · provider #{b.providerId}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge tone="brand">{b.bookingStatus}</Badge>
                  <Badge tone="gray">{b.paymentStatus}</Badge>
                  <span className="text-gray-700">ETB {b.price}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
