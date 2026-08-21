import { api } from "./api";
import * as inventoryService from "./inventoryService";

function mapBooking(b) {
  return {
    id: String(b.id),
    serviceName: b.service_name,
    serviceType: b.service_type,
    dates: b.dates || `${b.start_date || ""} – ${b.end_date || ""}`.trim(),
    price: b.price,
    customerName: b.customer_name,
    customerEmail: b.customer_email,
    paymentStatus: b.payment_status,
    bookingStatus: b.booking_status,
  };
}

function calendarFromInventory(items, labelKey = "name") {
  return items.map((item) => {
    const dates = {};
    const avail = item.availabilityDates || item.availability_dates || [];
    if (Array.isArray(avail)) {
      for (const entry of avail) {
        if (typeof entry === "string") {
          dates[entry] = "available";
        } else if (entry && entry.date) {
          dates[entry.date] = entry.status || "available";
        }
      }
    }
    return {
      id: String(item.id),
      label: item[labelKey] || item.roomType || item.name || `#${item.id}`,
      dates,
      seatsAvailable: item.maxParticipants || item.seats,
    };
  });
}

export async function getAvailabilityCalendar(providerType) {
  if (providerType === "hotel") {
    const rooms = await inventoryService.getRooms();
    return calendarFromInventory(
      rooms.map((r) => ({ ...r, name: r.roomType || r.room_type })),
      "name"
    );
  }
  if (providerType === "agency") {
    const packages = await inventoryService.getPackages();
    return calendarFromInventory(packages);
  }
  if (providerType === "transport") {
    const vehicles = await inventoryService.getVehicles();
    return calendarFromInventory(
      vehicles.map((v) => ({
        ...v,
        name: `${v.make} ${v.model}`.trim(),
      }))
    );
  }
  if (providerType === "driver") {
    try {
      const profile = await inventoryService.getGuideProfile();
      const ranges = profile.availabilityRanges || profile.availability_ranges || [];
      return ranges.map((r, i) => ({
        id: String(i),
        label: r.label || `Range ${i + 1}`,
        startDate: r.start || r.startDate,
        endDate: r.end || r.endDate,
      }));
    } catch {
      return [];
    }
  }
  return [];
}

export async function toggleAvailability(providerType, itemId, date) {
  // Persist by updating availability_dates on the inventory entity
  if (providerType === "hotel") {
    const rooms = await inventoryService.getRooms();
    const room = rooms.find((r) => String(r.id) === String(itemId));
    if (!room) return null;
    const dates = { ...(room.availabilityDatesMap || {}) };
    // Rebuild from list
    let list = [...(room.availabilityDates || [])];
    const idx = list.findIndex((d) => d === date || d?.date === date);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(date);
    }
    const updated = await inventoryService.updateRoom(room.id, {
      ...room,
      availabilityDates: list,
    });
    return calendarFromInventory([
      { ...updated, name: updated.roomType || updated.room_type },
    ])[0];
  }
  if (providerType === "agency") {
    const packages = await inventoryService.getPackages();
    const pkg = packages.find((p) => String(p.id) === String(itemId));
    if (!pkg) return null;
    let list = [...(pkg.availabilityDates || [])];
    const idx = list.findIndex((d) => d === date || d?.date === date);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(date);
    const updated = await inventoryService.updatePackage(pkg.id, {
      ...pkg,
      availabilityDates: list,
    });
    return calendarFromInventory([updated])[0];
  }
  if (providerType === "transport") {
    const vehicles = await inventoryService.getVehicles();
    const v = vehicles.find((x) => String(x.id) === String(itemId));
    if (!v) return null;
    let list = [...(v.availabilityDates || [])];
    const idx = list.findIndex((d) => d === date || d?.date === date);
    if (idx >= 0) list.splice(idx, 1);
    else list.push(date);
    const updated = await inventoryService.updateVehicle(v.id, {
      ...v,
      availabilityDates: list,
    });
    return calendarFromInventory([
      { ...updated, name: `${updated.make} ${updated.model}`.trim() },
    ])[0];
  }
  return null;
}

export async function getBookings() {
  const rows = await api.get("/providers/bookings");
  return rows.map(mapBooking);
}

export async function confirmBooking(id) {
  const b = await api.put(`/providers/bookings/${id}/confirm`, {});
  return mapBooking(b);
}

export async function cancelBooking(id) {
  const b = await api.put(`/providers/bookings/${id}/cancel`, {});
  return mapBooking(b);
}

export async function getAnalytics() {
  const stats = await api.get("/providers/dashboard/stats");
  return {
    metrics: {
      totalBookings: stats.bookings_total,
      pendingBookings: stats.bookings_pending,
      confirmedBookings: stats.bookings_confirmed,
      revenue: stats.revenue,
      reviews: stats.reviews_count,
      averageRating: stats.average_rating,
    },
    monthlyRevenue: [],
    monthlyBookings: [],
  };
}
