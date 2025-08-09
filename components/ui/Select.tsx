interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export default function Select({ label, options, placeholder, className = "", ...props }: SelectProps) {
  return (
    <div className="mb-4">
      {label && <label className="block mb-2">{label}</label>}
      <select className={`w-full p-2 rounded-lg bg-gray-700 ${className}`} {...props}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
