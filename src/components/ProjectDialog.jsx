// Création ou modification d'un projet : nom, client, couleur, taux horaire, budget.
import { useEffect, useState } from 'react';
import { Button, Dialog, Icon, Switch, TextField } from '../m3/index.jsx';
import { uid } from '../lib/time.js';
import { COLORS } from '../data.js';

const toNumber = (v) => (v === '' || v == null ? 0 : Number(String(v).replace(',', '.')));

export default function ProjectDialog({ state, currency, onClose, onSave }) {
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!state) return;
    setError('');
    const p = state.project;
    setForm(
      p
        ? { ...p, rate: p.rate ? String(p.rate) : '', budgetHours: p.budgetHours ? String(p.budgetHours) : '' }
        : { name: '', client: '', color: COLORS[0].key, billable: true, rate: '', budgetHours: '' },
    );
  }, [state]);

  if (!state || !form) return null;
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    const name = form.name.trim();
    const rate = toNumber(form.rate);
    const budget = toNumber(form.budgetHours);
    if (!name) return setError('Donnez un nom au projet.');
    if (!Number.isFinite(rate) || rate < 0) return setError('Le taux horaire doit être un nombre positif.');
    if (!Number.isFinite(budget) || budget < 0) return setError("Le budget doit être un nombre d'heures positif.");
    onSave({
      id: state.project?.id || uid(),
      name,
      client: (form.client || '').trim(),
      color: form.color,
      billable: !!form.billable,
      rate,
      budgetHours: budget,
      archived: !!state.project?.archived,
      createdAt: state.project?.createdAt || new Date().toISOString(),
    });
    onClose();
    return undefined;
  };

  return (
    <Dialog
      open
      headline={state.project ? 'Modifier le projet' : 'Nouveau projet'}
      onClose={onClose}
      actions={
        <>
          <Button variant="text" onClick={onClose}>Annuler</Button>
          <Button onClick={submit}>{state.project ? 'Enregistrer' : 'Créer le projet'}</Button>
        </>
      }
    >
      <TextField label="Nom du projet" value={form.name} onChange={set('name')} autoFocus />
      <TextField label="Client ou contexte (facultatif)" value={form.client} onChange={set('client')} />
      <div>
        <div className="label-large clp-label">Couleur</div>
        <div className="clp-swatches">
          {COLORS.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`clp-swatch${form.color === c.key ? ' is-selected' : ''}`}
              style={{ background: `var(--clp-${c.key})` }}
              aria-label={c.label}
              title={c.label}
              aria-pressed={form.color === c.key}
              onClick={() => set('color')(c.key)}
            >
              {form.color === c.key && <Icon name="check" />}
            </button>
          ))}
        </div>
      </div>
      <Switch checked={form.billable} onChange={set('billable')} label="Temps facturable" />
      <div className="clp-form-row">
        <TextField label="Taux horaire" type="number" min="0" step="0.5" value={form.rate} onChange={set('rate')} disabled={!form.billable} supportingText={`En ${currency} par heure`} />
        <TextField label="Budget (heures)" type="number" min="0" value={form.budgetHours} onChange={set('budgetHours')} supportingText="Facultatif : alerte à 85 %" />
      </div>
      {error && <div className="body-medium clp-error">{error}</div>}
    </Dialog>
  );
}
