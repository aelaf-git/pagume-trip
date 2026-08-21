import PageHeader from "../../components/common/PageHeader"
import DestinationManagement from "../../components/admin/DestinationManagement"

export default function AdminDestinations() {
  return (
    <div>
      <PageHeader title="Destinations" description="Add and manage places tourists can explore — with photos and map coordinates" />
      <DestinationManagement />
    </div>
  )
}
