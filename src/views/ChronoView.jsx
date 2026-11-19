// Vue principale : chrono, chiffres du jour et de la semaine, frise de la journée, sessions récentes.
import { useState } from 'react';
import { Button, Card, EmptyState, FAB, Icon, IconButton, LinearProgress, TextField } from '../m3/index.jsx';
import { Dot, SectionTitle, StatCard } from '../components/bits.jsx';
import DayTimeline from '../components/DayTimeline.jsx';
import { HOUR, addDays, fmtClock, fmtDayTitle, fmtDuration, fmtMoney, fmtTime, startOfDay, startOfWeek, toDateInput } from '../lib/time.js';
import { amount, durationOf, overlap, sumIn, withRunning } from '../lib/stats.js';
import { projectLabel, projectName } from '../data.js';

export default function ChronoView({ projects, byId, entries, timer, now, settings, lastProjectId, onStart, onStop, onUpdateTimer, onEditEntry, onDeleteEntry, onNewProject }) {
  const [draft, setDraft] = useState({ projectId: '', note: '' });
  const active = projects.filter((p) => !p.archived);

  if (active.length === 0 && !timer) {
    return (
      <Card variant="outlined" className="clp-card">
        <EmptyState icon="hourglass_empty" title="Créez votre premier projet" action={<Button icon="add" onClick={onNewProject}>Nouveau projet</Button>}>
          Un projet, c'est un client, une mission ou un cours. Le chrono s'y rattache pour savoir où passe votre temps.
        </EmptyState>
      </Card>
    );
  }

  const pick = (id) => (active.some((p) => p.id === id) ? id : '');
  const projectId = timer ? timer.projectId : pick(draft.projectId) || pick(lastProjectId) || active[0].id;
  const note = timer ? timer.note || '' : draft.note;
  const options = projects.filter((p) => !p.archived || p.id === projectId).map((p) => ({ value: p.id, label: p.name }));
  const setProject = (v) => (timer ? onUpdateTimer({ projectId: v }) : setDraft((d) => ({ ...d, projectId: v })));
  const setNote = (v) => (timer ? onUpdateTimer({ note: v }) : setDraft((d) => ({ ...d, note: v })));
  const toggle = () => {
    if (timer) onStop();
    else {
      onStart(projectId, note.trim());
      setDraft({ projectId, note: '' });
    }
  };

  const all = withRunning(entries, timer);
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  const week = startOfWeek(now);
  const weekEnd = addDays(week, 7);
  const todayMs = sumIn(all, today, tomorrow, now);
  const todayCount = all.filter((e) => overlap(e, today, tomorrow, now) > 0).length;
  const weekMs = sumIn(all, week, weekEnd, now);
  const weekBillableMs = sumIn(all, week, weekEnd, now, (e) => byId[e.projectId]?.billable);
  const weekAmount = all.reduce((acc, e) => acc + amount(overlap(e, week, weekEnd, now), byId[e.projectId]), 0);
  const goalMs = (Number(settings.weeklyGoal) || 0) * HOUR;
  const client = byId[projectId]?.client;

  const since = addDays(today, -6);
  const recent = entries.filter((e) => new Date(e.start) >= since).sort((a, b) => new Date(b.start) - new Date(a.start));
  const groups = [];
  recent.forEach((e) => {
    const key = toDateInput(e.start);
    let g = groups.find((x) => x.key === key);
    if (!g) groups.push((g = { key, date: startOfDay(e.start), items: [], total: 0 }));
    g.items.push(e);
    g.total += durationOf(e, now);
  });

  return (
    <>
      <section className={`clp-hero${timer ? ' is-running' : ''}`}>
        <div>
          <div className="clp-hero__status label-large">
            {timer ? (
              <><span className="clp-pulse" />En cours depuis {fmtTime(timer.start)}{client ? ` · ${client}` : ''}</>
            ) : (
              <><Icon name="schedule" size={18} />Prêt à démarrer{client ? ` · ${client}` : ''}</>
            )}
          </div>
          <div className="clp-hero__inputs">
            <TextField label="Projet" value={projectId} onChange={setProject} options={options} />
            <TextField label="Sur quoi travaillez-vous ?" value={note} onChange={setNote} placeholder="Décrivez la tâche (facultatif)" onKeyDown={(e) => e.key === 'Enter' && toggle()} />
          </div>
        </div>
        <div className="clp-hero__clock">
          <div className="clp-clock">{fmtClock(timer ? now - new Date(timer.start) : 0)}</div>
          <FAB size="large" className="clp-hero__fab" icon={timer ? 'stop' : 'play_arrow'} label={timer ? 'Arrêter le chrono' : 'Démarrer le chrono'} onClick={toggle} />
        </div>
      </section>

      <div className="clp-stats">
        <StatCard icon="today" label="Aujourd'hui" value={fmtDuration(todayMs)} sub={todayCount ? `${todayCount} session${todayCount > 1 ? 's' : ''}` : 'Aucune session pour le moment'} />
        <StatCard icon="date_range" label="Cette semaine" value={fmtDuration(weekMs)} sub={goalMs ? `${Math.round((weekMs / goalMs) * 100)} % de l'objectif de ${settings.weeklyGoal} h` : 'Aucun objectif défini'}>
          {goalMs > 0 && <LinearProgress value={weekMs / goalMs} />}
        </StatCard>
        <StatCard icon="payments" label="À facturer cette semaine" value={fmtMoney(weekAmount, settings.currency)} sub={weekMs ? `${Math.round((weekBillableMs / weekMs) * 100)} % du temps est facturable` : 'Pas encore de temps cette semaine'} />
      </div>

      <DayTimeline entries={all} byId={byId} now={now} total={todayMs} />

      <SectionTitle>Sessions des 7 derniers jours</SectionTitle>
      {groups.length === 0 ? (
        <Card variant="outlined" className="clp-card">
          <EmptyState icon="timer" title="Aucune session récente">Lancez le chrono ou ajoutez une saisie manuelle : vos sessions apparaîtront ici, jour par jour.</EmptyState>
        </Card>
      ) : (
        groups.map((g) => (
          <Card key={g.key} variant="outlined" className="clp-day">
            <div className="clp-day__head">
              <span className="title-small">{fmtDayTitle(g.date, now)}</span>
              <span className="label-large m3-muted">{fmtDuration(g.total)}</span>
            </div>
            {g.items.map((e) => {
              const p = byId[e.projectId];
              return (
                <div key={e.id} className="clp-entry">
                  <Dot project={p} />
                  <div className="clp-entry__main">
                    <div className="body-large clp-ellipsis">{e.note || <span className="m3-muted">Sans description</span>}</div>
                    <div className="body-small m3-muted clp-ellipsis">{projectLabel(p)}</div>
                  </div>
                  <div className="body-medium m3-muted clp-tabular">{fmtTime(e.start)} – {fmtTime(e.end)}</div>
                  <div className="title-small clp-num">{fmtDuration(durationOf(e, now))}</div>
                  <div className="clp-entry__actions">
                    <IconButton icon="play_arrow" label={`Relancer : ${e.note || projectName(p)}`} disabled={!p || p.archived} onClick={() => onStart(e.projectId, e.note)} />
                    <IconButton icon="edit" label="Modifier" onClick={() => onEditEntry(e)} />
                    <IconButton icon="delete" label="Supprimer" onClick={() => onDeleteEntry(e.id)} />
                  </div>
                </div>
              );
            })}
          </Card>
        ))
      )}
    </>
  );
}
