import Card from "../common/Card";
import { PROVIDER_CATEGORIES } from "../../constants/providerCategories";
import { DOCUMENT_REQUIREMENTS } from "../../constants/documentRequirements";
import { humanizeFieldName } from "../../utils/registrationValidation";
import { CheckCircle2, Clock } from "lucide-react";

function formatValue(value) {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  return value || "—";
}

export default function ReviewStep({ category, categoryData, documents }) {
  const config = PROVIDER_CATEGORIES[category];
  const requirements = DOCUMENT_REQUIREMENTS[category] || [];
  const fieldEntries = [...(config.requiredFields || []), ...(config.requiredArrayFields || [])];

  return (
    <div className="space-y-6">
      <Card title={`${config.label} Details`}>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fieldEntries.map((field) => (
            <div key={field}>
              <dt className="text-xs text-gray-400 uppercase tracking-wide">{humanizeFieldName(field)}</dt>
              <dd className="text-sm text-gray-800 mt-0.5">{formatValue(categoryData[field])}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card title="Uploaded Documents">
        <ul className="divide-y divide-gray-100">
          {requirements.map((doc) => {
            const uploaded = documents[doc.key]?.status === "success";
            return (
              <li key={doc.key} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-gray-700">{doc.label}</span>
                {uploaded ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-4 w-4" /> Uploaded
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-500">
                    <Clock className="h-4 w-4" /> Pending
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
