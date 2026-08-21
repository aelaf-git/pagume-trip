import RolePortalLayout from "./RolePortalLayout";
import { driverNavItems } from "../constants/navigation";

export default function DriverLayout() {
  return <RolePortalLayout portalName="Driver" navItems={driverNavItems} />;
}
