import RolePortalLayout from "./RolePortalLayout";
import { agencyNavItems } from "../constants/navigation";

export default function AgencyLayout() {
  return <RolePortalLayout portalName="Agency" navItems={agencyNavItems} />;
}
