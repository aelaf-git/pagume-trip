import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import Card from "../common/Card";
import Button from "../common/Button";
import StepIndicator from "./StepIndicator";
import DocumentUpload from "./DocumentUpload";
import ReviewStep from "./ReviewStep";
import { PROVIDER_CATEGORIES } from "../../constants/providerCategories";
import { validateCategoryFields, validateDocuments } from "../../utils/registrationValidation";
import * as registrationService from "../../services/registrationService";

const STEPS = ["Business Details", "Documents", "Review & Submit"];

export default function RegistrationWizard({ category }) {
  const navigate = useNavigate();
  const config = PROVIDER_CATEGORIES[category];
  const FieldsComponent = config.FieldsComponent;

  const [currentStep, setCurrentStep] = useState(0);
  const [categoryData, setCategoryData] = useState({});
  const [documents, setDocuments] = useState({});
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const updateCategoryField = (name, value) => {
    setCategoryData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const goNext = () => {
    if (currentStep === 0) {
      const fieldErrors = validateCategoryFields(category, categoryData);
      if (Object.keys(fieldErrors).length > 0) return setErrors(fieldErrors);
    }
    if (currentStep === 1) {
      const docErrors = validateDocuments(category, documents);
      if (Object.keys(docErrors).length > 0) return setErrors(docErrors);
    }
    setErrors({});
    setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await registrationService.submitRegistration({
        category,
        categoryData,
        documents: Object.fromEntries(
          Object.entries(documents).map(([key, doc]) => [key, { name: doc.name, size: doc.size }])
        ),
      });
      setSubmitResult(result);
    } catch (err) {
      setSubmitError(err.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitResult) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md text-center">
          <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Application Submitted</h2>
          <p className="text-sm text-gray-500 mb-6">
            Thanks for registering with Pagume Trip. Your application (ID: {submitResult.providerId}) is
            now <strong>under review</strong>. We'll notify you once it's verified — this usually takes
            2–3 business days.
          </p>
          <Button className="w-full" onClick={() => navigate("/login")}>
            Go to Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 justify-center mb-8">
          <img src="/pagume_logo.png" alt="Pagume Trip" className="h-7 w-7 object-contain" />
          <span className="text-lg font-bold text-gray-900">Pagume Trip</span>
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 text-center mb-1">
          Register as a {config.label}
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          Complete the steps below to submit your application for review.
        </p>

        <StepIndicator steps={STEPS} currentIndex={currentStep} />

        <Card>
          {currentStep === 0 && (
            <FieldsComponent data={categoryData} errors={errors} onChange={updateCategoryField} />
          )}

          {currentStep === 1 && (
            <DocumentUpload category={category} documents={documents} onChange={setDocuments} errors={errors} />
          )}

          {currentStep === 2 && (
            <ReviewStep category={category} categoryData={categoryData} documents={documents} />
          )}

          {submitError && <p className="text-sm text-red-500 mt-4">{submitError}</p>}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={goBack}
              className={currentStep === 0 ? "invisible" : ""}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button onClick={goNext}>
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} loading={submitting}>
                Submit Application
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
