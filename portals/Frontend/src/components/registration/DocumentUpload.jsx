import FileUploadSlot from "./FileUploadSlot";
import { DOCUMENT_REQUIREMENTS } from "../../constants/documentRequirements";

export default function DocumentUpload({ category, documents, onChange, errors }) {
  const requirements = DOCUMENT_REQUIREMENTS[category] || [];

  return (
    <div className="space-y-4">
      {requirements.map((requirement) => (
        <FileUploadSlot
          key={requirement.key}
          label={requirement.label}
          accept=".pdf,.jpg,.jpeg,.png"
          required={requirement.required}
          file={documents[requirement.key]}
          error={errors[requirement.key]}
          onChange={(file) => onChange((prev) => ({ ...prev, [requirement.key]: file }))}
        />
      ))}
    </div>
  );
}
