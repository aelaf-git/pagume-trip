import Card from "../common/Card";
import Button from "../common/Button";
import { ONBOARDING_STATUS_CONFIG } from "../../constants/onboardingStatus";

export default function OnboardingStatusCard({ status, reviewNotes, submittedAt, onResubmit }) {
  const config = ONBOARDING_STATUS_CONFIG[status];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <Card>
      <div className="flex items-start gap-4">
        <div className={`h-12 w-12 rounded-full flex items-center justify-center border ${config.colors}`}>
          <Icon className={`h-6 w-6 ${config.iconColor}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-gray-900">Verification Status</h3>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${config.colors}`}>
              {config.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-2">{config.description}</p>

          {status === "REJECTED" && reviewNotes && (
            <div className="mt-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-sm text-red-700">
              <strong>Reviewer notes:</strong> {reviewNotes}
            </div>
          )}

          {submittedAt && (
            <p className="text-xs text-gray-400 mt-3">
              Submitted on {new Date(submittedAt).toLocaleDateString()}
            </p>
          )}

          {status === "REJECTED" && onResubmit && (
            <Button size="sm" variant="outline" className="mt-4" onClick={onResubmit}>
              Update & Resubmit
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
