import React, { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, className = "", ...props }, ref) => {
  return (
    <div className="mb-4">
      {label && <label className="block mb-2">{label}</label>}
      <input ref={ref} className={`w-full p-2 rounded-lg bg-gray-700 ${className}`} {...props} />
    </div>
  );
});

export default Input;
