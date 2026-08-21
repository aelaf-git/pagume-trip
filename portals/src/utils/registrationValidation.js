import { PROVIDER_CATEGORIES } from "../constants/providerCategories";
import { DOCUMENT_REQUIREMENTS } from "../constants/documentRequirements";

export function validateCategoryFields(category, data) {
  const config = PROVIDER_CATEGORIES[category];
  const errors = {};

  (config.requiredFields || []).forEach((field) => {
    const value = data[field];
    if (value === undefined || value === null || String(value).trim() === "") {
      errors[field] = "This field is required.";
    }
  });

  (config.requiredArrayFields || []).forEach((field) => {
    if (!data[field] || data[field].length === 0) {
      errors[field] = "Please select at least one option.";
    }
  });

  return errors;
}

export function validateDocuments(category, documents) {
  const requirements = DOCUMENT_REQUIREMENTS[category] || [];
  const errors = {};

  requirements.forEach((doc) => {
    if (doc.required && documents[doc.key]?.status !== "success") {
      errors[doc.key] = "Please upload this required document.";
    }
  });

  return errors;
}

export function humanizeFieldName(name) {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}
