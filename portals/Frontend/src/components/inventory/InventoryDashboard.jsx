import { useAuth } from "../../contexts/AuthContext";
import PageHeader from "../common/PageHeader";
import Card from "../common/Card";
import RoomManagement from "./RoomManagement";
import TourPackageBuilder from "./TourPackageBuilder";
import VehicleFleetManagement from "./VehicleFleetManagement";
import GuideProfileEditor from "./GuideProfileEditor";

const INVENTORY_VIEWS = {
  hotel: {
    title: "Room Management",
    description: "Create and manage the rooms you offer across your property.",
    Component: RoomManagement,
  },
  agency: {
    title: "Tour Package Builder",
    description: "Build and manage the tour packages you sell to travelers.",
    Component: TourPackageBuilder,
  },
  transport: {
    title: "Vehicle Fleet Management",
    description: "Manage the vehicles in your rental fleet, pricing, and availability.",
    Component: VehicleFleetManagement,
  },
  driver: {
    title: "Profile & Expertise",
    description: "Keep your languages, coverage areas, availability, and rates up to date.",
    Component: GuideProfileEditor,
  },
};

export default function InventoryDashboard() {
  const { user } = useAuth();
  const providerType = user?.providerType;
  const config = INVENTORY_VIEWS[providerType];

  if (!config) {
    return (
      <div>
        <PageHeader title="Inventory Management" description="Manage the services you offer." />
        <Card>
          <p className="text-sm text-gray-500">
            Inventory management isn't available for this provider type.
          </p>
        </Card>
      </div>
    );
  }

  const { title, description, Component } = config;

  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <Component />
    </div>
  );
}
