// Exercita computeStoreState com relógio controlado. Roda com:
//   npx tsx scripts/check-hours.ts
import { computeStoreState, toMinutes, fromMinutes } from "../src/services/store-hours.js";

let pass = 0;
let fail = 0;
function check(label: string, got: unknown, want: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? "ok  " : "FAIL"} ${label}${ok ? "" : `\n       esperado ${JSON.stringify(want)}, veio ${JSON.stringify(got)}`}`);
}

const store = { paused: false, pausedMsg: null, lastOrderMinutes: 0 };
// Datas em America/Sao_Paulo (UTC-3): 2026-07-15 é uma quarta-feira (weekday 3).
const at = (iso: string) => new Date(iso);

// --- Janela normal: quarta 18:00 -> 23:00 ---
const normal = [{ weekday: 3, opensAt: "18:00", closesAt: "23:00", active: true }];
check("quarta 19:00 -> aberta", computeStoreState(store, normal, at("2026-07-15T22:00:00Z")).open, true);
check("quarta 17:59 -> fechada", computeStoreState(store, normal, at("2026-07-15T20:59:00Z")).open, false);
check("quarta 23:00 -> fechada (fim exclusivo)", computeStoreState(store, normal, at("2026-07-16T02:00:00Z")).open, false);
check("quinta 19:00 -> fechada (outro dia)", computeStoreState(store, normal, at("2026-07-16T22:00:00Z")).open, false);

// --- Janela que vira o dia: quarta 19:00 -> 02:00 ---
const overnight = [{ weekday: 3, opensAt: "19:00", closesAt: "02:00", active: true }];
check("quarta 20:00 -> aberta", computeStoreState(store, overnight, at("2026-07-15T23:00:00Z")).open, true);
check("quinta 01:00 (madrugada) -> aberta", computeStoreState(store, overnight, at("2026-07-16T04:00:00Z")).open, true);
check("quinta 02:30 -> fechada", computeStoreState(store, overnight, at("2026-07-16T05:30:00Z")).open, false);
check("quarta 18:00 -> fechada", computeStoreState(store, overnight, at("2026-07-15T21:00:00Z")).open, false);

// --- Dois turnos no mesmo dia ---
const dois = [
  { weekday: 3, opensAt: "11:00", closesAt: "15:00", active: true },
  { weekday: 3, opensAt: "18:00", closesAt: "23:00", active: true },
];
check("almoco 12:00 -> aberta", computeStoreState(store, dois, at("2026-07-15T15:00:00Z")).open, true);
check("entre turnos 16:00 -> fechada", computeStoreState(store, dois, at("2026-07-15T19:00:00Z")).open, false);
check("jantar 19:00 -> aberta", computeStoreState(store, dois, at("2026-07-15T22:00:00Z")).open, true);

// --- lastOrderMinutes encolhe o fim ---
const grace = { paused: false, pausedMsg: null, lastOrderMinutes: 30 };
check("22:45 com last order 30min -> fechada", computeStoreState(grace, normal, at("2026-07-16T01:45:00Z")).open, false);
check("22:15 com last order 30min -> aberta", computeStoreState(grace, normal, at("2026-07-16T01:15:00Z")).open, true);

// --- Pausa manual vence o horário ---
const pausada = { paused: true, pausedMsg: "Fila cheia", lastOrderMinutes: 0 };
const st = computeStoreState(pausada, normal, at("2026-07-15T22:00:00Z"));
check("pausada durante horario -> fechada", st.open, false);
check("pausada usa a mensagem do admin", st.closedReason, "Fila cheia");

// --- Sem horario configurado ---
check("sem horarios -> fechada", computeStoreState(store, [], at("2026-07-15T22:00:00Z")).open, false);

// --- nextOpenAt ---
const antes = computeStoreState(store, normal, at("2026-07-15T14:00:00Z")); // quarta 11:00
check("fechada de manha -> avisa que abre hoje", antes.closedReason, "Estamos fechados. Abrimos hoje às 18:00");
check("fechada de manha -> tem nextOpenAt", antes.nextOpenAt instanceof Date, true);

const depois = computeStoreState(store, normal, at("2026-07-16T03:00:00Z")); // quinta 00:00
check("fechada apos o expediente -> aponta a proxima quarta", depois.closedReason, "Estamos fechados. Abrimos quarta-feira às 18:00");

// --- helpers ---
check("toMinutes 18:30", toMinutes("18:30"), 1110);
check("toMinutes invalido", toMinutes("25:00"), null);
check("fromMinutes 1110", fromMinutes(1110), "18:30");

console.log(`\n${pass} passaram, ${fail} falharam`);
process.exit(fail ? 1 : 0);
