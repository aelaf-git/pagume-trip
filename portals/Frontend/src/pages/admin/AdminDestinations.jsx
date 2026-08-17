import PageHeader from "../../components/common/PageHeader"
import DestinationManagement from "../../components/admin/DestinationManagement"

export default function AdminDestinations() {
  return (
    <div>
      <PageHeader title="Destinations" description="Manage tour destinations across Ethiopia" />
      <DestinationManagement />
    </div>
  )
}
