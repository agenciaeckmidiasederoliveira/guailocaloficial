import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

interface DiaHorario {
  ativo: boolean;
  abertura: string;
  fechamento: string;
  is24h: boolean;
}

interface Horarios {
  segunda: DiaHorario;
  terca: DiaHorario;
  quarta: DiaHorario;
  quinta: DiaHorario;
  sexta: DiaHorario;
  sabado: DiaHorario;
  domingo: DiaHorario;
}

const DIAS_SEMANA = [
  { key: "segunda", label: "Segunda" },
  { key: "terca", label: "Terça" },
  { key: "quarta", label: "Quarta" },
  { key: "quinta", label: "Quinta" },
  { key: "sexta", label: "Sexta" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
] as const;

const DEFAULT_HORARIO: DiaHorario = {
  ativo: false,
  abertura: "08:00",
  fechamento: "18:00",
  is24h: false,
};

interface HorarioFuncionamentoProps {
  value: string;
  onChange: (value: string) => void;
}

// Parse string format back to structured data
const parseHorarioString = (str: string): Horarios => {
  const horarios: Horarios = {
    segunda: { ...DEFAULT_HORARIO },
    terca: { ...DEFAULT_HORARIO },
    quarta: { ...DEFAULT_HORARIO },
    quinta: { ...DEFAULT_HORARIO },
    sexta: { ...DEFAULT_HORARIO },
    sabado: { ...DEFAULT_HORARIO },
    domingo: { ...DEFAULT_HORARIO },
  };

  if (!str) return horarios;

  // Try to parse JSON format first
  try {
    const parsed = JSON.parse(str);
    if (typeof parsed === "object") {
      return { ...horarios, ...parsed };
    }
  } catch {
    // Not JSON, try legacy format
  }

  return horarios;
};

// Convert structured data to string for storage
const horariosToString = (horarios: Horarios): string => {
  return JSON.stringify(horarios);
};

// Generate readable display text
export const formatHorarioDisplay = (str: string): string => {
  if (!str) return "";
  
  try {
    const horarios: Horarios = JSON.parse(str);
    const parts: string[] = [];
    
    DIAS_SEMANA.forEach(({ key, label }) => {
      const dia = horarios[key as keyof Horarios];
      if (dia.ativo) {
        if (dia.is24h) {
          parts.push(`${label}: 24h`);
        } else {
          parts.push(`${label}: ${dia.abertura}-${dia.fechamento}`);
        }
      }
    });
    
    return parts.join(" | ") || "Horário não informado";
  } catch {
    return str; // Return as-is if not JSON
  }
};

export function HorarioFuncionamento({ value, onChange }: HorarioFuncionamentoProps) {
  const [horarios, setHorarios] = useState<Horarios>(() => parseHorarioString(value));

  useEffect(() => {
    onChange(horariosToString(horarios));
  }, [horarios, onChange]);

  const updateDia = (dia: keyof Horarios, updates: Partial<DiaHorario>) => {
    setHorarios((prev) => ({
      ...prev,
      [dia]: { ...prev[dia], ...updates },
    }));
  };

  const copiarParaTodos = () => {
    // Find first active day
    const primeiroDiaAtivo = DIAS_SEMANA.find(
      ({ key }) => horarios[key as keyof Horarios].ativo
    );

    if (!primeiroDiaAtivo) return;

    const horarioBase = horarios[primeiroDiaAtivo.key as keyof Horarios];

    setHorarios((prev) => {
      const newHorarios = { ...prev };
      DIAS_SEMANA.forEach(({ key }) => {
        if (newHorarios[key as keyof Horarios].ativo) {
          newHorarios[key as keyof Horarios] = {
            ...newHorarios[key as keyof Horarios],
            abertura: horarioBase.abertura,
            fechamento: horarioBase.fechamento,
            is24h: horarioBase.is24h,
          };
        }
      });
      return newHorarios;
    });
  };

  const hasAtivoDia = DIAS_SEMANA.some(
    ({ key }) => horarios[key as keyof Horarios].ativo
  );

  const previewText = formatHorarioDisplay(horariosToString(horarios));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Horário de Funcionamento</Label>
        {hasAtivoDia && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copiarParaTodos}
            className="gap-2"
          >
            <Copy className="h-3.5 w-3.5" />
            Copiar para todos
          </Button>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-border p-4">
          {DIAS_SEMANA.map(({ key, label }) => {
            const dia = horarios[key as keyof Horarios];
            return (
              <div
                key={key}
                className="flex flex-wrap items-center gap-3 py-2 border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-2 min-w-[120px]">
                  <Checkbox
                    id={`dia-${key}`}
                    checked={dia.ativo}
                    onCheckedChange={(checked) =>
                      updateDia(key as keyof Horarios, { ativo: !!checked })
                    }
                  />
                  <Label
                    htmlFor={`dia-${key}`}
                    className={`cursor-pointer ${!dia.ativo ? "text-muted-foreground" : ""}`}
                  >
                    {label}
                  </Label>
                </div>

                {dia.ativo && (
                  <>
                    {!dia.is24h && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={dia.abertura}
                          onChange={(e) =>
                            updateDia(key as keyof Horarios, { abertura: e.target.value })
                          }
                          className="w-[110px] h-9"
                        />
                        <span className="text-muted-foreground">às</span>
                        <Input
                          type="time"
                          value={dia.fechamento}
                          onChange={(e) =>
                            updateDia(key as keyof Horarios, { fechamento: e.target.value })
                          }
                          className="w-[110px] h-9"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2 ml-auto">
                      <Switch
                        id={`24h-${key}`}
                        checked={dia.is24h}
                        onCheckedChange={(checked) =>
                          updateDia(key as keyof Horarios, { is24h: checked })
                        }
                      />
                      <Label
                        htmlFor={`24h-${key}`}
                        className="cursor-pointer text-sm"
                      >
                        24h
                      </Label>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Preview */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <Label className="text-sm text-muted-foreground mb-3 block">
            📋 Preview - Como será exibido:
          </Label>
          <div className="space-y-1 text-sm">
            {previewText ? (
              previewText.split(" | ").map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>{item}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground italic">Nenhum dia selecionado</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
