// Calculs sur les sessions : durées, chevauchement avec une période, arrondi, montants.
import { HOUR, MINUTE } from './time.js';

export const RUNNING_ID = '__running';

/** Les sessions + celle en cours (sans fin) pour les totaux en direct. */
export function withRunning(entries, timer) {
  if (!timer) return entries;
  return [...entries, { id: RUNNING_ID, projectId: timer.projectId, note: timer.note || '', start: timer.start, end: null }];
}

export const endOf = (e, now) => (e.end ? new Date(e.end).getTime() : now.getTime());
export const durationOf = (e, now) => Math.max(0, endOf(e, now) - new Date(e.start).getTime());

/** Part d'une session comprise dans [from, to[. */
export function overlap(e, from, to, now) {
  const s = Math.max(new Date(e.start).getTime(), +from);
  const en = Math.min(endOf(e, now), +to);
  return Math.max(0, en - s);
}

export function sumIn(list, from, to, now, keep = () => true) {
  return list.reduce((acc, e) => (keep(e) ? acc + overlap(e, from, to, now) : acc), 0);
}

/** Arrondi au palier supérieur (0 = pas d'arrondi). */
export function roundMs(ms, roundTo) {
  if (!roundTo) return ms;
  const step = roundTo * MINUTE;
  return Math.ceil(ms / step) * step;
}

export const amount = (ms, project) => (project?.billable ? (ms / HOUR) * (Number(project.rate) || 0) : 0);
