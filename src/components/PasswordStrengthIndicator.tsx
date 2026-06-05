import { Check, X } from "lucide-react";
import { useMemo } from "react";

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface Requirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: Requirement[] = [
  { label: "Mínimo 8 caracteres", test: (p) => p.length >= 8 },
  { label: "Letra maiúscula", test: (p) => /[A-Z]/.test(p) },
  { label: "Letra minúscula", test: (p) => /[a-z]/.test(p) },
  { label: "Número", test: (p) => /[0-9]/.test(p) },
  { label: "Símbolo especial (!@#$%)", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const passedRequirements = useMemo(() => {
    return requirements.filter((req) => req.test(password)).length;
  }, [password]);

  const strength = useMemo(() => {
    if (passedRequirements <= 1) return { label: "Fraca", color: "bg-destructive" };
    if (passedRequirements <= 2) return { label: "Fraca", color: "bg-destructive" };
    if (passedRequirements <= 3) return { label: "Média", color: "bg-warning" };
    if (passedRequirements <= 4) return { label: "Boa", color: "bg-secondary/70" };
    return { label: "Forte", color: "bg-secondary" };
  }, [passedRequirements]);

  if (!password) return null;

  return (
    <div className="mt-3 space-y-2">
      {/* Strength Bar */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                passedRequirements >= level ? strength.color : "bg-muted"
              }`}
            />
          ))}
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {strength.label}
        </span>
      </div>

      {/* Requirements Checklist */}
      <div className="grid grid-cols-2 gap-1">
        {requirements.map((req) => {
          const passed = req.test(password);
          return (
            <div
              key={req.label}
              className={`flex items-center gap-1.5 text-xs ${
                passed ? "text-secondary" : "text-muted-foreground"
              }`}
            >
              {passed ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
              {req.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) errors.push("Mínimo 8 caracteres");
  if (!/[A-Z]/.test(password)) errors.push("Deve conter letra maiúscula");
  if (!/[a-z]/.test(password)) errors.push("Deve conter letra minúscula");
  if (!/[0-9]/.test(password)) errors.push("Deve conter número");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("Deve conter símbolo especial");

  return { valid: errors.length === 0, errors };
}
