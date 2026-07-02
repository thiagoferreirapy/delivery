export function brl(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
export function shortDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(new Date(iso));
}
export function timeAgo(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h`;
}
