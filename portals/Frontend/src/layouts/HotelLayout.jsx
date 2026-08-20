import RolePortalLayout from "./RolePortalLayout";
import { hotelNavItems } from "../constants/navigation";

export default function HotelLayout() {
  return <RolePortalLayout portalName="Hotel" navItems={hotelNavItems} />;
}
