import { Check } from "lucide-react";

export default function StepIndicator({ steps, currentIndex }) {
  return (
    <ol className="flex items-center w-full mb-8">
      {steps.map((label, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <li key={label} className="flex-1 flex items-center">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 shrink-0
                  ${isCompleted ? "bg-brand-600 border-brand-600 text-white" : ""}
                  ${isCurrent ? "border-brand-600 text-brand-600" : ""}
                  ${!isCompleted && !isCurrent ? "border-gray-300 text-gray-400" : ""}`}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              <span className={`mt-2 text-xs text-center ${isCurrent ? "text-brand-600 font-medium" : "text-gray-400"}`}>
                {label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`h-0.5 flex-1 -mt-5 ${isCompleted ? "bg-brand-600" : "bg-gray-200"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
