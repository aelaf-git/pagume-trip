import { forwardRef } from "react";

const Textarea = forwardRef(function Textarea({ label, error, id, rows = 3, className = "", ...props }, ref) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {props.required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        id={id}
        ref={ref}
        rows={rows}
        className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm outline-none transition-colors
          focus:ring-2 focus:ring-brand-500 focus:border-brand-500
          ${error ? "border-red-400" : "border-gray-300"} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
});

export default Textarea;
