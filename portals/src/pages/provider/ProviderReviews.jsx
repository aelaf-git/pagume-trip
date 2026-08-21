import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { getReviews, hideReview } from "../../services/reviewService";

export default function ProviderReviews() {
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState(null);

  const load = () =>
    getReviews()
      .then(setReviews)
      .catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const onHide = async (id) => {
    try {
      await hideReview(id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Reviews" description="Customer feedback stored in the database" />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Card>
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-500">No reviews yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {reviews.map((r) => (
              <li key={r.id} className="py-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900">
                      {r.authorName} · {r.rating}/5
                    </p>
                    <p className="mt-1 text-gray-600">{r.comment}</p>
                    <p className="mt-1 text-xs text-gray-400">{r.status}</p>
                  </div>
                  {r.status === "VISIBLE" && (
                    <Button size="sm" variant="secondary" onClick={() => onHide(r.id)}>
                      Hide
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
