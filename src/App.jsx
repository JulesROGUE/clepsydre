// Clepsydre : suivi du temps par projet, 100 % local.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Chip, FAB, IconButton, NavigationRail, Snackbar, TopAppBar } from './m3/index.jsx';
import { usePersistentState } from './lib/storage.js';
import { setThemeMode } from './lib/theme.js';
import { useNow } from './lib/useNow.js';
import { MINUTE, fmtClock, uid } from './lib/time.js';
import { DEFAULT_SETTINGS, KEYS, projectName } from './data.js';
import ChronoView from './views/ChronoView.jsx';
import WeekView from './views/WeekView.jsx';
import ProjectsView from './views/ProjectsView.jsx';
import ReportView from './views/ReportView.jsx';
import SettingsView from './views/SettingsView.jsx';
import EntryDialog from './components/EntryDialog.jsx';
import ProjectDialog from './components/ProjectDialog.jsx';
import './app.css';

const VIEWS = [
  { value: 'chrono', label: 'Chrono', icon: 'timer' },
  { value: 'semaine', label: 'Semaine', icon: 'calendar_view_week' },
  { value: 'projets', label: 'Projets', icon: 'folder_open' },
  { value: 'rapport', label: 'Rapport', icon: 'bar_chart' },
  { value: 'reglages', label: 'Réglages', icon: 'settings' },
];
const TITLES = { chrono: "Aujourd'hui", semaine: 'Feuille de temps', projets: 'Projets', rapport: 'Rapport', reglages: 'Réglages' };

function readHash() {
  const h = decodeURIComponent(window.location.hash.slice(1));
  return VIEWS.some((v) => v.value === h) ? h : 'chrono';
}
const isDark = () => document.documentElement.dataset.theme === 'dark';

export default function App() {
  const [view, setView] = useState(readHash);
  useEffect(() => {
    const onHash = () => setView(readHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const go = (v) => {
    setView(v);
    if (window.location.hash !== `#${v}`) window.location.hash = v;
  };

  const [projects, setProjects] = usePersistentState(KEYS.projects, []);
  const [entries, setEntries] = usePersistentState(KEYS.entries, []);
  const [timer, setTimer] = usePersistentState(KEYS.timer, null);
  const [storedSettings, setStoredSettings] = usePersistentState(KEYS.settings, DEFAULT_SETTINGS);
  const settings = useMemo(() => ({ ...DEFAULT_SETTINGS, ...storedSettings }), [storedSettings]);
  const now = useNow(timer ? 1000 : 30000);

  const [entryDialog, setEntryDialog] = useState(null);
  const [projectDialog, setProjectDialog] = useState(null);
  const [snack, setSnack] = useState(null);
  const [dark, setDark] = useState(isDark);
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(isDark()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  const notify = useCallback((message, undo) => setSnack({ message, undo, id: Date.now() }), []);
  const closeSnack = useCallback(() => setSnack(null), []);

  const byId = useMemo(() => Object.fromEntries(projects.map((p) => [p.id, p])), [projects]);
  const hasActive = projects.some((p) => !p.archived);
  const lastProjectId = useMemo(() => {
    const last = [...entries].sort((a, b) => new Date(b.end) - new Date(a.end)).find((e) => byId[e.projectId] && !byId[e.projectId].archived);
    return last?.projectId || projects.find((p) => !p.archived)?.id || '';
  }, [entries, byId, projects]);

  useEffect(() => {
    document.title = timer ? `${fmtClock(now - new Date(timer.start))} · ${projectName(byId[timer.projectId])} — Clepsydre` : 'Clepsydre';
  }, [timer, now, byId]);

  // --- Chrono ---
  const commit = (t, at) => {
    if (at - new Date(t.start) < MINUTE) return false;
    const entry = { id: uid(), projectId: t.projectId, note: (t.note || '').trim(), start: t.start, end: at.toISOString() };
    setEntries((list) => [...list, entry]);
    return true;
  };
  const startTimer = (projectId, note = '') => {
    if (!projectId) {
      setProjectDialog({});
      return;
    }
    const at = new Date();
    if (timer) commit(timer, at);
    setTimer({ projectId, note, start: at.toISOString() });
  };
  const stopTimer = () => {
    if (!timer) return;
    const saved = commit(timer, new Date());
    setTimer(null);
    notify(saved ? 'Session enregistrée.' : "Moins d'une minute : la session n'a pas été gardée.");
  };
  const updateTimer = (patch) => setTimer((t) => (t ? { ...t, ...patch } : t));

  // --- Sessions ---
  const saveEntry = (e) => {
    const exists = entries.some((x) => x.id === e.id);
    setEntries((list) => (exists ? list.map((x) => (x.id === e.id ? e : x)) : [...list, e]));
    notify(exists ? 'Session modifiée.' : 'Session ajoutée.');
  };
  const deleteEntry = (id) => {
    const removed = entries.find((e) => e.id === id);
    if (!removed) return;
    setEntries((list) => list.filter((e) => e.id !== id));
    notify('Session supprimée.', () => setEntries((list) => [...list, removed]));
  };

  // --- Projets ---
  const saveProject = (p) => {
    const exists = projects.some((x) => x.id === p.id);
    setProjects((list) => (exists ? list.map((x) => (x.id === p.id ? p : x)) : [...list, p]));
    notify(exists ? 'Projet mis à jour.' : `Projet « ${p.name} » créé.`);
  };
  const archiveProject = (id, archived) => {
    if (archived && timer?.projectId === id) {
      commit(timer, new Date());
      setTimer(null);
    }
    setProjects((list) => list.map((p) => (p.id === id ? { ...p, archived } : p)));
    notify(archived ? 'Projet archivé.' : 'Projet réactivé.');
  };
  const deleteProject = (id) => {
    const removed = projects.find((p) => p.id === id);
    if (!removed) return;
    if (timer?.projectId === id) setTimer(null);
    setProjects((list) => list.filter((p) => p.id !== id));
    notify('Projet supprimé.', () => setProjects((list) => [...list, removed]));
  };

  // --- Données ---
  const changeSettings = (patch) => setStoredSettings((s) => ({ ...DEFAULT_SETTINGS, ...s, ...patch }));
  const importAll = ({ projects: p, entries: e, settings: s }) => {
    setTimer(null);
    setProjects(p);
    setEntries(e);
    if (s && typeof s === 'object') setStoredSettings({ ...DEFAULT_SETTINGS, ...s });
  };
  const resetAll = () => {
    setTimer(null);
    setProjects([]);
    setEntries([]);
    setStoredSettings(DEFAULT_SETTINGS);
    notify('Toutes les données ont été effacées.');
  };
  const toggleTheme = () => setThemeMode(dark ? 'light' : 'dark');

  const common = { projects, byId, entries, timer, now, settings };
  let content;
  if (view === 'semaine') content = <WeekView {...common} onAdd={(preset) => (hasActive ? setEntryDialog({ preset }) : setProjectDialog({}))} />;
  else if (view === 'projets') {
    content = (
      <ProjectsView {...common} onNew={() => setProjectDialog({})} onEdit={(project) => setProjectDialog({ project })}
        onArchive={archiveProject} onDelete={deleteProject} onStart={(id) => { startTimer(id); go('chrono'); }} />
    );
  } else if (view === 'rapport') content = <ReportView {...common} onNotify={notify} />;
  else if (view === 'reglages') {
    content = <SettingsView settings={settings} onChange={changeSettings} projects={projects} entries={entries} onImport={importAll} onReset={resetAll} onNotify={notify} />;
  } else {
    content = (
      <ChronoView {...common} lastProjectId={lastProjectId} onStart={startTimer} onStop={stopTimer} onUpdateTimer={updateTimer}
        onEditEntry={(entry) => setEntryDialog({ entry })} onDeleteEntry={deleteEntry} onNewProject={() => setProjectDialog({})} />
    );
  }

  let actions = null;
  if (view === 'chrono') actions = <Button variant="tonal" icon="edit_calendar" disabled={!hasActive} onClick={() => setEntryDialog({ preset: {} })}>Saisie manuelle</Button>;
  if (view === 'projets') actions = <Button icon="add" onClick={() => setProjectDialog({})}>Nouveau projet</Button>;
  const runningChip = timer && view !== 'chrono' ? (
    <Chip icon="timer" className="clp-running-chip" onClick={() => go('chrono')}>
      {projectName(byId[timer.projectId])} · {fmtClock(now - new Date(timer.start))}
    </Chip>
  ) : null;

  return (
    <div className="m3-app">
      <NavigationRail
        items={VIEWS}
        value={view}
        onChange={go}
        fab={
          <FAB
            icon={timer ? 'stop' : 'play_arrow'}
            color={timer ? 'tertiary' : 'primary'}
            label={timer ? 'Arrêter le chrono' : 'Démarrer le chrono'}
            onClick={() => (timer ? stopTimer() : startTimer(lastProjectId))}
          />
        }
        footer={<IconButton icon={dark ? 'light_mode' : 'dark_mode'} label={dark ? 'Passer au thème clair' : 'Passer au thème sombre'} onClick={toggleTheme} />}
      />
      <div className="m3-main">
        <TopAppBar title={TITLES[view]} actions={(runningChip || actions) && <>{runningChip}{actions}</>} />
        <div className="m3-content">
          <div className="clp-page">{content}</div>
        </div>
      </div>

      <EntryDialog state={entryDialog} projects={projects} onClose={() => setEntryDialog(null)} onSave={saveEntry} onDelete={deleteEntry} />
      <ProjectDialog state={projectDialog} currency={settings.currency} onClose={() => setProjectDialog(null)} onSave={saveProject} />
      <Snackbar
        key={snack?.id}
        open={!!snack}
        message={snack?.message}
        actionLabel={snack?.undo ? 'Annuler' : undefined}
        onAction={() => { snack?.undo?.(); setSnack(null); }}
        onClose={closeSnack}
      />
    </div>
  );
}
