interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "danger" | "edit" | "cancel";
  size?: "sm" | "md" | "lg";
}

const variants = {
  primary: "bg-amber-500 text-black font-bold hover:bg-amber-600",
  secondary: "bg-gray-600 text-white hover:bg-gray-700",
  success: "bg-green-600 text-white hover:bg-green-700",
  danger: "bg-red-600 text-white hover:bg-red-700",
  edit: "bg-blue-600 text-white hover:bg-blue-700",
  cancel: "bg-gray-600 text-white hover:bg-gray-700",
};

const sizes = {
  sm: "px-3 py-1 text-sm",
  md: "px-4 py-2",
  lg: "w-full py-2",
};

export default function Button({ variant = "primary", size = "md", className = "", children, ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-lg font-semibold transition-colors ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
