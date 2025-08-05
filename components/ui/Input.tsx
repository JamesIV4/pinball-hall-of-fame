interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, className = "", ...props }: InputProps) {
  return (
    <div className="mb-4">
      {label && <label className="block mb-2">{label}</label>}
      <input
        className={`w-full p-2 rounded-lg bg-gray-700 ${className}`}
        {...props}
      />
    </div>
  );
}