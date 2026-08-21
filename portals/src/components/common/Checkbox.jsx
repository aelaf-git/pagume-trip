export default function Checkbox({ label, description, checked, onChange, error, id, ...props }) {
  return (
    <div>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          {...props}
        />
        <span>
          <span className="block text-sm font-medium text-gray-800">{label}</span>
          {description && <span className="block text-xs text-gray-500 mt-0.5">{description}</span>}
        </span>
      </label>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
