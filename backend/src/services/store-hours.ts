import type { StoreDTO, OpeningHourDTO } from "@cabana/shared";
import { prisma } from "../lib/prisma.js";
import { env } from "../config/env.js";

// Estado de funcionamento da loja. Fonte da verdade é sempre o servidor:
// o front exibe, mas quem barra o pedido é o backend (ver assertStoreOpen).

export interface StoreState {
  open: boolean;
  closedReason: string | null;
  nextOpenAt: Date | null;
}

const WEEKDAY_NAMES = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

// "18:30" -> 1110 (minutos desde a meia-noite). Retorna null se malformado.
export function toMinutes(hhmm: string): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

const pad = (n: number) => String(n).padStart(2, "0");
export const fromMinutes = (min: number): string =>
  `${pad(Math.floor(min / 60) % 24)}:${pad(min % 60)}`;

// Relógio da loja no fuso configurado, independente do fuso do servidor.
// Usa Intl para não depender de TZ do processo nem de lib externa.
export function storeClock(now: Date = new Date()): { weekday: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: env.storeTimezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const wdMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const weekday = wdMap[get("weekday")] ?? 0;
  // Intl pode devolver "24" à meia-noite em hour12:false — normaliza para 0.
  const hour = Number(get("hour")) % 24;
  const minute = Number(get("minute"));
  return { weekday, minutes: hour * 60 + minute };
}

// Uma faixa está aberta agora? Trata a virada do dia: closesAt <= opensAt
// significa que fecha no dia seguinte (ex.: 19:00 -> 02:00).
// `graceMinutes` encolhe o fim da janela (last order antes de fechar).
function isWithin(
  h: { weekday: number; opensAt: string; closesAt: string },
  clock: { weekday: number; minutes: number },
  graceMinutes: number
): boolean {
  const open = toMinutes(h.opensAt);
  const close = toMinutes(h.closesAt);
  if (open == null || close == null) return false;

  const overnight = close <= open;
  const effectiveClose = close - graceMinutes;

  if (!overnight) {
    // janela normal, dentro do mesmo dia
    return clock.weekday === h.weekday && clock.minutes >= open && clock.minutes < effectiveClose;
  }

  // Vira o dia: a janela é [open, 24:00) no weekday, e [00:00, close) no dia seguinte.
  if (clock.weekday === h.weekday && clock.minutes >= open) return true;
  const nextDay = (h.weekday + 1) % 7;
  if (clock.weekday === nextDay && clock.minutes < effectiveClose) return true;
  return false;
}

// Quando a loja abre de novo, a partir de agora. Varre os próximos 7 dias.
// Devolve Date real (UTC correto) reconstruindo a partir do offset do fuso.
function computeNextOpen(
  hours: { weekday: number; opensAt: string; active: boolean }[],
  now: Date
): Date | null {
  const clock = storeClock(now);
  const actives = hours.filter((h) => h.active && toMinutes(h.opensAt) != null);
  if (!actives.length) return null;

  for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
    const wd = (clock.weekday + dayOffset) % 7;
    const todays = actives
      .filter((h) => h.weekday === wd)
      .map((h) => toMinutes(h.opensAt)!)
      .sort((a, b) => a - b);

    for (const openMin of todays) {
      // hoje: só serve se ainda não passou
      if (dayOffset === 0 && openMin <= clock.minutes) continue;
      const minutesAhead = dayOffset * 1440 + openMin - clock.minutes;
      return new Date(now.getTime() + minutesAhead * 60_000);
    }
  }
  return null;
}

export function computeStoreState(
  store: { paused: boolean; pausedMsg: string | null; lastOrderMinutes: number },
  hours: { weekday: number; opensAt: string; closesAt: string; active: boolean }[],
  now: Date = new Date()
): StoreState {
  if (store.paused) {
    return {
      open: false,
      closedReason: store.pausedMsg?.trim() || "Estamos temporariamente fechados",
      nextOpenAt: null, // pausa é manual: só o admin sabe quando volta
    };
  }

  const actives = hours.filter((h) => h.active);
  if (!actives.length) {
    return { open: false, closedReason: "Nenhum horário de funcionamento configurado", nextOpenAt: null };
  }

  const clock = storeClock(now);
  const grace = Math.max(0, store.lastOrderMinutes || 0);
  const open = actives.some((h) => isWithin(h, clock, grace));
  if (open) return { open: true, closedReason: null, nextOpenAt: null };

  // Fechada agora: se ainda abre hoje, diz o horário; senão, diz o dia.
  const nextOpenAt = computeNextOpen(actives, now);
  let reason = "Estamos fechados no momento";
  if (nextOpenAt) {
    const nextClock = storeClock(nextOpenAt);
    const hhmm = fromMinutes(nextClock.minutes);
    reason =
      nextClock.weekday === clock.weekday
        ? `Estamos fechados. Abrimos hoje às ${hhmm}`
        : `Estamos fechados. Abrimos ${WEEKDAY_NAMES[nextClock.weekday]} às ${hhmm}`;
  }
  return { open: false, closedReason: reason, nextOpenAt };
}

// Garante o singleton. Sem horário configurado a loja nasce pausada — é mais
// seguro que aceitar pedido 24h por engano.
export async function getStoreSettings() {
  const existing = await prisma.storeSettings.findUnique({
    where: { id: "default" },
    include: { hours: { orderBy: [{ weekday: "asc" }, { opensAt: "asc" }] } },
  });
  if (existing) return existing;
  return prisma.storeSettings.create({
    data: { id: "default" },
    include: { hours: { orderBy: [{ weekday: "asc" }, { opensAt: "asc" }] } },
  });
}

export function serializeOpeningHour(h: any): OpeningHourDTO {
  return {
    id: h.id,
    weekday: h.weekday,
    opensAt: h.opensAt,
    closesAt: h.closesAt,
    active: h.active,
  };
}

export async function loadStoreDTO(now: Date = new Date()): Promise<StoreDTO> {
  const s = await getStoreSettings();
  const state = computeStoreState(s, s.hours, now);
  return {
    name: s.name,
    paused: s.paused,
    pausedMsg: s.pausedMsg ?? null,
    lastOrderMinutes: s.lastOrderMinutes,
    hours: s.hours.map(serializeOpeningHour),
    open: state.open,
    closedReason: state.closedReason,
    nextOpenAt: state.nextOpenAt ? state.nextOpenAt.toISOString() : null,
  };
}

// Estado atual sem montar o DTO inteiro (usado no gate de criação de pedido)
export async function getStoreState(now: Date = new Date()): Promise<StoreState> {
  const s = await getStoreSettings();
  return computeStoreState(s, s.hours, now);
}
