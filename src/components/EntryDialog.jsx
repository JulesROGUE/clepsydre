// Ajout ou modification d'une session à la main.
import { useEffect, useState } from 'react';
import { Button, Dialog, TextField } from '../m3/index.jsx';
import { fmtDuration, fromInputs, toDateInput, toTimeInput, uid } from '../lib/time.js';
import { projectLabel } from '../data.js';

export default function EntryDialog({ state, projects, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!state) return;
    setError('');
    if (state.entry) {
      const e = state.entry;
      setForm({ projectId: e.projectId, note: e.note || '', date: toDateInput(e.start), start: toTimeInput(e.start), end: toTimeInput(e.end) });
    } else {
      const preset = state.preset || {};
      const firstActive = projects.find((p) => !p.archived);
      setForm({ projectId: preset.projectId || firstActive?.id || '', note: '', date: toDateInput(preset.date || new Date()), start: '09:00', end: '10:00' });
    }
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state || !form) return null;
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const options = projects.filter((p) => !p.archived || p.id === form.projectId).map((p) => ({ value: p.id, label: projectLabel(p) }));
  const start = fromInputs(form.date, form.start);
  const end = fromInputs(form.date, form.end);
  const preview = start && end && end > start ? fmtDuration(end - start) : null;

  const submit = () => {
    if (!form.projectId) return setError('Choisissez un projet.');
    if (!start || !end) return setError('La date ou une heure est invalide.');
    if (end <= start) return setError("L'heure de fin doit être après l'heure de début.");
    if (start > new Date()) return setError('Cette session commence dans le futur.');
    onSave({ id: state.entry?.id || uid(), projectId: form.projectId, note: form.note.trim(), start: start.toISOString(), end: end.toISOString() });
    onClose();
    return undefined;
  };

  return (
    <Dialog
      open
      headline={state.entry ? 'Modifier la session' : 'Saisie manuelle'}
      onClose={onClose}
      actions={
        <>
          {state.entry && (
            <Button variant="text" icon="delete" style={{ marginRight: 'auto' }} onClick={() => { onDelete(state.entry.id); onClose(); }}>
              Supprimer
            </Button>
          )}
          <Button variant="text" onClick={onClose}>Annuler</Button>
          <Button onClick={submit}>Enregistrer</Button>
        </>
      }
    >
      <TextField label="Projet" value={form.projectId} onChange={set('projectId')} options={options} />
      <TextField label="Description (facultatif)" value={form.note} onChange={set('note')} placeholder="Ex. : maquette de la page d'accueil" />
      <div className="clp-form-row">
        <TextField label="Date" type="date" value={form.date} onChange={set('date')} />
        <TextField label="Début" type="time" value={form.start} onChange={set('start')} />
        <TextField label="Fin" type="time" value={form.end} onChange={set('end')} />
      </div>
      <div className={`body-medium ${error ? 'clp-error' : ''}`}>{error || (preview ? `Durée : ${preview}` : ' ')}</div>
    </Dialog>
  );
}
