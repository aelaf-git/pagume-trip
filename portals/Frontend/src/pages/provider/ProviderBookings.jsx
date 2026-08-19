import { useAuth } from "../../contexts/AuthContext"
import PageHeader from "../../components/common/PageHeader"
import AvailabilityCalendar from "../../components/bookings/AvailabilityCalendar"
import BookingManagement from "../../components/bookings/BookingManagement"
import DriverScheduleCalendar from "../../components/inventory/driver/DriverScheduleCalendar"
import DriverAssignments from "../../components/inventory/driver/DriverAssignments"

export default function ProviderBookings() {
  const { user } = useAuth()
  const isDriver = user?.providerType === "driver"

  if (isDriver) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="My Schedule & Assignments"
          description="View your calendar, manage availability, and track tour assignments and preparation."
        />
        <DriverScheduleCalendar />
        <DriverAssignments />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings & Availability"
        description="Manage your calendar, view incoming bookings, and take action on requests."
      />
      <AvailabilityCalendar />
      <BookingManagement />
    </div>
  )
}
