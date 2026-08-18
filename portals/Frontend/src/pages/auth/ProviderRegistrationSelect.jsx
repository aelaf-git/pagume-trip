import { Link } from "react-router-dom";
import { Hotel, Building2, Car, UserRound, Compass } from "lucide-react";
import Card from "../../components/common/Card";

const PROVIDER_TYPES = [
  { key: "hotel", title: "Hotel / Resort", description: "List rooms, manage pricing and availability.", icon: Hotel },
  { key: "agency", title: "Travel Agency / Tour Operator", description: "Create tour packages and manage bookings.", icon: Building2 },
  { key: "transport", title: "Car Rental Provider", description: "Offer vehicles and transportation services.", icon: Car },
  { key: "driver", title: "Independent Tour Guide / Driver", description: "Offer guided tours or driving services.", icon: UserRound },
];

export default function ProviderRegistrationSelect() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="flex items-center gap-2 mb-8">
        <Compass className="h-8 w-8 text-brand-600" />
        <span className="text-xl font-bold text-gray-900">Pagume Trip</span>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Register your business</h1>
      <p className="text-gray-500 mb-8">Choose the type of tourism service you provide</p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl w-full">
        {PROVIDER_TYPES.map(({ key, title, description, icon: Icon }) => (
          <Link key={key} to={`/register/${key}`}>
            <Card className="h-full hover:border-brand-500 hover:shadow-md transition-all cursor-pointer">
              <Icon className="h-8 w-8 text-brand-600 mb-3" />
              <h3 className="font-semibold text-gray-800">{title}</h3>
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            </Card>
          </Link>
        ))}
      </div>

      <Link to="/login" className="text-sm text-gray-500 hover:underline mt-8">
        Already registered? Sign in
      </Link>
    </div>
  );
}
