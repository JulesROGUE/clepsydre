// Clés de stockage, réglages par défaut et palette des projets.
export const KEYS = {
  projects: 'clepsydre.projects',
  entries: 'clepsydre.entries',
  timer: 'clepsydre.timer',
  settings: 'clepsydre.settings',
};

export const DEFAULT_SETTINGS = { weeklyGoal: 35, currency: 'EUR', roundTo: 0 };

export const COLORS = [
  { key: 'violet', label: 'Violet' },
  { key: 'rose', label: 'Rose' },
  { key: 'teal', label: 'Sarcelle' },
  { key: 'ambre', label: 'Ambre' },
  { key: 'bleu', label: 'Bleu' },
  { key: 'vert', label: 'Vert' },
  { key: 'gris', label: 'Gris' },
];

export const CURRENCIES = [
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'CHF', label: 'Franc suisse (CHF)' },
  { value: 'CAD', label: 'Dollar canadien ($ CA)' },
  { value: 'USD', label: 'Dollar américain ($ US)' },
  { value: 'GBP', label: 'Livre sterling (£)' },
];

export const ROUNDINGS = [
  { value: '0', label: 'Aucun arrondi' },
  { value: '5', label: '5 minutes' },
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
];

export const colorOf = (p) => `var(--clp-${p?.color || 'gris'})`;
export const projectName = (p) => (p ? p.name : 'Projet supprimé');
export const projectLabel = (p) => (p?.client ? `${p.name} · ${p.client}` : projectName(p));

export function initials(name = '') {
  const words = name.split(/\s+/).filter(Boolean);
  const main = words.filter((w) => w.length > 2);
  return (main.length ? main : words).slice(0, 2).map((w) => w[0].toUpperCase()).join('') || '?';
}
