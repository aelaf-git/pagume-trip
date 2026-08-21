import RolePortalLayout from "./RolePortalLayout";
import { carRentalNavItems } from "../constants/navigation";

export default function CarRentalLayout() {
  return <RolePortalLayout portalName="Car Rental" navItems={carRentalNavItems} />;
}
