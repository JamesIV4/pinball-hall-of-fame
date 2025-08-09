interface FormContainerProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function FormContainer({ title, children, className = "" }: FormContainerProps) {
  return (
    <div className={`bg-gray-800 p-6 rounded-lg shadow-lg ${className}`}>
      <h2 className="text-2xl font-bold mb-4 text-amber-400">{title}</h2>
      {children}
    </div>
  );
}
