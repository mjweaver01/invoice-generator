interface SpinnerProps {
  label?: string;
}

export default function Spinner({ label = "Loading..." }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4" />
      <p className="text-gray-500 text-lg">{label}</p>
    </div>
  );
}
