import { forwardRef } from "react";

const Select = forwardRef(function Select(
  { label, error, id, options = [], placeholder = "Select an option", className = "", ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {props.required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        id={id}
        ref={ref}
        className={`w-full rounded-lg border px-3 py-2 text-sm shadow-sm outline-none bg-white transition-colors
          focus:ring-2 focus:ring-brand-500 focus:border-brand-500
          ${error ? "border-red-400" : "border-gray-300"} ${className}`}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
});

export default Select;
