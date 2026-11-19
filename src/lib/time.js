// Dates et durées en heure locale (semaine du lundi au dimanche).
export const MINUTE = 60_000;
export const HOUR = 3_600_000;

export const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const pad = (n) => String(n).padStart(2, '0');

export function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
export function startOfWeek(d) {
  const x = startOfDay(d);
  return addDays(x, -((x.getDay() + 6) % 7));
}
export function startOfMonth(d) {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}
export function addMonths(d, n) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}
export const sameDay = (a, b) => startOfDay(a).getTime() === startOfDay(b).getTime();

/** 3 h 05, ou 45 min */
export function fmtDuration(ms) {
  const totalMin = Math.round(Math.max(0, ms) / MINUTE);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  return `${h} h ${pad(m)}`;
}
/** 01:23:45 */
export function fmtClock(ms) {
  const s = Math.floor(Math.max(0, ms) / 1000);
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}
/** 7,5 (heures décimales, pour l'export) */
export const fmtDecimalHours = (ms) => (Math.round((ms / HOUR) * 100) / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 });
export const fmtTime = (d) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
export const fmtDate = (d, opts = { day: 'numeric', month: 'short' }) => new Date(d).toLocaleDateString('fr-FR', opts);

export function fmtDayTitle(d, now = new Date()) {
  if (sameDay(d, now)) return "Aujourd'hui";
  if (sameDay(d, addDays(now, -1))) return 'Hier';
  const s = fmtDate(d, { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function fmtMoney(value, currency = 'EUR', maxDigits = 0) {
  try {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: maxDigits }).format(value || 0);
  } catch {
    return `${Math.round(value || 0)} ${currency}`;
  }
}

export function toDateInput(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}
export function toTimeInput(d) {
  const x = new Date(d);
  return `${pad(x.getHours())}:${pad(x.getMinutes())}`;
}
export function fromInputs(date, time) {
  if (!date || !time) return null;
  const [y, mo, da] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  if ([y, mo, da, h, mi].some((n) => Number.isNaN(n))) return null;
  return new Date(y, mo - 1, da, h, mi, 0, 0);
}
