import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, XCircle, ClipboardList } from "lucide-react";
import Card from "../common/Card";
import Button from "../common/Button";
import Badge from "../common/Badge";
import { BOOKING_STATUSES, PAYMENT_STATUSES } from "../../constants/bookingOptions";
import * as bookingService from "../../services/bookingService";
import { queryKeys, STALE_BOOKINGS_MS } from "../../lib/queryKeys";

export default function BookingManagement() {
  const queryClient = useQueryClient();
  const [actionId, setActionId] = useState(null);
  const [notice, setNotice] = useState(null);
  const noticeTimer = useRef(null);

  const bookingsQuery = useQuery({
    queryKey: queryKeys.bookings,
    queryFn: () => bookingService.getBookings(),
    staleTime: STALE_BOOKINGS_MS,
  });

  const bookings = bookingsQuery.data ?? [];
  const loading = bookingsQuery.isLoading;

  const showNotice = (message) => {
    setNotice(message);
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3000);
  };

  const invalidateBookings = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.bookings });

  const handleConfirm = async (id) => {
    setActionId(id);
    try {
      await bookingService.confirmBooking(id);
      showNotice(`Booking ${id} confirmed.`);
      await invalidateBookings();
    } finally {
      setActionId(null);
    }
  };

  const handleCancel = async (id) => {
    setActionId(id);
    try {
      await bookingService.cancelBooking(id);
      showNotice(`Booking ${id} cancelled.`);
      await invalidateBookings();
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-4">
      {notice && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {notice}
        </div>
      )}

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-sm text-gray-400">
            Loading bookings…
          </div>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <ClipboardList className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No bookings yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3 font-medium">Booking ID</th>
                  <th className="px-4 py-3 font-medium">Service</th>
                  <th className="px-4 py-3 font-medium">Dates</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => {
                  const statusConfig =
                    BOOKING_STATUSES[booking.bookingStatus] ?? BOOKING_STATUSES.DRAFT;
                  const paymentConfig =
                    PAYMENT_STATUSES[booking.paymentStatus] ?? PAYMENT_STATUSES.UNPAID;
                  const isPending = booking.bookingStatus === "PENDING";
                  const isProcessing = actionId === booking.id;

                  return (
                    <tr key={booking.id} className="border-b border-gray-100 last:border-0">
                      <td className="px-4 py-3 font-medium text-gray-900">{booking.id}</td>
                      <td className="px-4 py-3 text-gray-700">{booking.serviceName}</td>
                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{booking.dates}</td>
                      <td className="px-4 py-3 text-gray-700">
                        ETB {booking.price.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{booking.customerName}</td>
                      <td className="px-4 py-3">
                        <Badge tone={paymentConfig.tone}>{paymentConfig.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={statusConfig.tone}>{statusConfig.label}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {isPending ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleConfirm(booking.id)}
                                loading={isProcessing}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Confirm
                              </Button>
                              <Button
                                size="sm"
                                variant="danger"
                                onClick={() => handleCancel(booking.id)}
                                loading={isProcessing}
                              >
                                <XCircle className="h-3.5 w-3.5" /> Cancel
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
