import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Validates that a URL uses only safe protocols (http/https)
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// Mapa de dia da semana (0 = domingo)
const DIAS_MAP: Record<number, string> = {
  0: "domingo",
  1: "segunda",
  2: "terca",
  3: "quarta",
  4: "quinta",
  5: "sexta",
  6: "sabado",
};

// Converte string de horário "HH:MM" para minutos
function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Verifica se uma empresa está aberta agora baseado no horário JSON
export function isEmpresaAberta(horarioJson: string | null): boolean {
  if (!horarioJson) return false;

  try {
    const horarios = JSON.parse(horarioJson);
    const agora = new Date();
    const diaSemana = DIAS_MAP[agora.getDay()];
    const horaAtual = agora.getHours() * 60 + agora.getMinutes();

    const diaHorario = horarios[diaSemana];
    if (!diaHorario?.ativo) return false;
    if (diaHorario.is24h) return true;

    const abertura = parseTimeToMinutes(diaHorario.abertura);
    const fechamento = parseTimeToMinutes(diaHorario.fechamento);

    // Trata horário que atravessa meia-noite
    if (fechamento < abertura) {
      return horaAtual >= abertura || horaAtual <= fechamento;
    }

    return horaAtual >= abertura && horaAtual <= fechamento;
  } catch {
    return false;
  }
}
