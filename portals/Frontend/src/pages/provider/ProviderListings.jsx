import Card from "../../components/common/Card";
import PageHeader from "../../components/common/PageHeader";

export default function ProviderListings() {
  return (
    <div>
      <PageHeader title="My Listings" description="Manage your hotels, rooms, packages, or vehicles." />
      <Card>
        <p className="text-sm text-gray-500">Listings table/grid goes here.</p>
      </Card>
    </div>
  );
}
