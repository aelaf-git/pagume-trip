import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import { getPayments } from "../../services/paymentService";

export default function ProviderPayments() {
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getPayments()
      .then(setPayments)
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Earnings and payouts from the database" />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Card>
        {payments.length === 0 ? (
          <p className="text-sm text-gray-500">No payments yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium">
                    {p.currency} {Number(p.amount).toLocaleString()}
                  </p>
                  <p className="text-gray-500">{p.reference || "—"}</p>
                </div>
                <Badge tone={p.status === "COMPLETED" ? "green" : "amber"}>
                  {p.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
