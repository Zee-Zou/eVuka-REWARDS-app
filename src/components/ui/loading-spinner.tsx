import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({
  size = 24,
  className = "",
}: LoadingSpinnerProps) {
  return <Loader2 className={`animate-spin ${className}`} size={size} />;
}

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <LoadingSpinner size={32} />
    </div>
  );
}

export function LoadingButton({
  children,
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading: boolean }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      className={`inline-flex items-center justify-center ${props.className || ""}`}
    >
      {loading && <LoadingSpinner size={16} className="mr-2" />}
      {children}
    </button>
  );
}
