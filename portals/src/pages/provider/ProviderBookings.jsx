import PageHeader from "../../components/common/PageHeader";
import AvailabilityCalendar from "../../components/bookings/AvailabilityCalendar";
import BookingManagement from "../../components/bookings/BookingManagement";

export default function ProviderBookings() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings & Availability"
        description="Manage your calendar, view incoming bookings, and take action on requests."
      />
      <AvailabilityCalendar />
      <BookingManagement />
    </div>
  );
}
