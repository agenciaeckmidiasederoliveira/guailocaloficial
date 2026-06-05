import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  text?: string;
  className?: string;
}

export function LoadingSpinner({ text = "Carregando...", className = "" }: LoadingSpinnerProps) {
  return (
    <div className={`flex min-h-[60vh] flex-col items-center justify-center ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      {text && <p className="mt-2 text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}
