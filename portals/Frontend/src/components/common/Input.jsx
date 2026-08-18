import { forwardRef } from "react";

const Input = forwardRef(function Input({ label, error, id, className = "", ...props }, ref) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm outline-none transition-colors
          focus:ring-2 focus:ring-brand-500 focus:border-brand-500
          ${error ? "border-red-400" : "border-gray-300"} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
});

export default Input;

