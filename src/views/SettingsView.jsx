// Réglages : thème, objectif, devise, arrondi, sauvegarde et restauration des données.
import { useState } from 'react';
import { Button, Card, Dialog, Divider, SegmentedButton, TextField } from '../m3/index.jsx';
import { SectionTitle, SettingRow } from '../components/bits.jsx';
import { getThemeMode, setThemeMode } from '../lib/theme.js';
import { openTextFile, saveTextFile } from '../lib/files.js';
import { toDateInput } from '../lib/time.js';
import { CURRENCIES, ROUNDINGS } from '../data.js';

const parseGoal = (v) => Number(String(v).replace(',', '.'));

export default function SettingsView({ settings, onChange, projects, entries, onImport, onReset, onNotify }) {
  const [mode, setMode] = useState(getThemeMode);
  const [goal, setGoal] = useState(String(settings.weeklyGoal));
  const [confirm, setConfirm] = useState(false);
  const goalValid = goal !== '' && Number.isFinite(parseGoal(goal)) && parseGoal(goal) >= 0 && parseGoal(goal) <= 168;

  const changeGoal = (v) => {
    setGoal(v);
    const n = parseGoal(v);
    if (v !== '' && Number.isFinite(n) && n >= 0 && n <= 168) onChange({ weeklyGoal: n });
  };

  const backup = async () => {
    const data = { app: 'clepsydre', version: 1, exportedAt: new Date().toISOString(), projects, entries, settings };
    try {
      const res = await saveTextFile(`clepsydre-sauvegarde-${toDateInput(new Date())}.json`, JSON.stringify(data, null, 2), [{ name: 'Sauvegarde Clepsydre', extensions: ['json'] }]);
      if (res?.saved) onNotify('Sauvegarde enregistrée.');
    } catch {
      onNotify("La sauvegarde a échoué. Vérifiez le dossier choisi.");
    }
  };

  const restore = async () => {
    try {
      const file = await openTextFile([{ name: 'Sauvegarde Clepsydre', extensions: ['json'] }]);
      if (!file) return;
      const data = JSON.parse(file.content);
      if (data?.app !== 'clepsydre' || !Array.isArray(data.projects) || !Array.isArray(data.entries)) throw new Error('format');
      const okProjects = data.projects.filter((p) => p && typeof p.id === 'string' && typeof p.name === 'string');
      const ids = new Set(okProjects.map((p) => p.id));
      const okEntries = data.entries.filter(
        (e) => e && typeof e.id === 'string' && ids.has(e.projectId) && !Number.isNaN(Date.parse(e.start)) && !Number.isNaN(Date.parse(e.end)),
      );
      onImport({ projects: okProjects, entries: okEntries, settings: data.settings });
      setGoal(String(data.settings?.weeklyGoal ?? settings.weeklyGoal));
      onNotify(`Sauvegarde restaurée : ${okProjects.length} projets, ${okEntries.length} sessions.`);
    } catch {
      onNotify("Ce fichier n'est pas une sauvegarde Clepsydre valide.");
    }
  };

  return (
    <>
      <SectionTitle>Préférences</SectionTitle>
      <Card variant="outlined" className="clp-settings">
        <SettingRow icon="palette" title="Thème" desc="Suivre le système ou choisir un thème.">
          <SegmentedButton
            options={[
              { value: 'system', label: 'Système' },
              { value: 'light', label: 'Clair' },
              { value: 'dark', label: 'Sombre' },
            ]}
            value={mode}
            onChange={(m) => { setThemeMode(m); setMode(m); }}
          />
        </SettingRow>
        <Divider />
        <SettingRow icon="flag" title="Objectif hebdomadaire" desc="Nombre d'heures visé par semaine (0 pour ne pas en avoir).">
          <TextField className="clp-field-s" type="number" min="0" max="168" value={goal} onChange={changeGoal} aria-label="Objectif hebdomadaire en heures" error={goalValid ? undefined : 'Entre 0 et 168 h'} />
        </SettingRow>
        <Divider />
        <SettingRow icon="payments" title="Devise" desc="Utilisée pour les taux horaires et les montants.">
          <TextField className="clp-field-m" options={CURRENCIES} value={settings.currency} onChange={(v) => onChange({ currency: v })} aria-label="Devise" />
        </SettingRow>
        <Divider />
        <SettingRow icon="more_time" title="Arrondi dans les rapports" desc="Chaque session est arrondie au palier supérieur dans le rapport et l'export CSV.">
          <TextField className="clp-field-m" options={ROUNDINGS} value={String(settings.roundTo || 0)} onChange={(v) => onChange({ roundTo: Number(v) })} aria-label="Arrondi" />
        </SettingRow>
      </Card>

      <SectionTitle>Vos données</SectionTitle>
      <Card variant="outlined" className="clp-settings">
        <SettingRow icon="lock" title="100 % local" desc={`${projects.length} projet${projects.length > 1 ? 's' : ''} et ${entries.length} session${entries.length > 1 ? 's' : ''}, stockés uniquement sur cet ordinateur. Aucun compte, aucune connexion.`} />
        <Divider />
        <SettingRow icon="download" title="Sauvegarder" desc="Exporte projets, sessions et réglages dans un fichier JSON.">
          <Button variant="tonal" icon="download" onClick={backup}>Exporter</Button>
        </SettingRow>
        <Divider />
        <SettingRow icon="upload" title="Restaurer" desc="Remplace les données actuelles par celles d'une sauvegarde.">
          <Button variant="outlined" icon="upload" onClick={restore}>Importer</Button>
        </SettingRow>
        <Divider />
        <SettingRow icon="delete_forever" title="Tout effacer" desc="Supprime définitivement projets, sessions et réglages.">
          <Button variant="danger" onClick={() => setConfirm(true)}>Effacer</Button>
        </SettingRow>
      </Card>

      <Dialog
        open={confirm}
        icon="warning"
        headline="Tout effacer ?"
        onClose={() => setConfirm(false)}
        actions={
          <>
            <Button variant="text" onClick={() => setConfirm(false)}>Annuler</Button>
            <Button variant="danger" onClick={() => { onReset(); setGoal('35'); setConfirm(false); }}>Tout effacer</Button>
          </>
        }
      >
        Projets, sessions et réglages seront supprimés de cet ordinateur. Pensez à exporter une sauvegarde avant.
      </Dialog>
    </>
  );
}
