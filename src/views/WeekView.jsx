// Feuille de temps : projets × jours, objectif hebdomadaire et heures par jour.
import { useState } from 'react';
import { Button, Card, EmptyState, IconButton, LinearProgress } from '../m3/index.jsx';
import { Dot, SectionTitle } from '../components/bits.jsx';
import { HOUR, addDays, fmtDate, fmtDuration, sameDay, startOfWeek } from '../lib/time.js';
import { overlap, sumIn, withRunning } from '../lib/stats.js';
import { colorOf, projectName } from '../data.js';

const weekday = (d) => fmtDate(d, { weekday: 'short' }).replace('.', '');

export default function WeekView({ byId, entries, timer, now, settings, onAdd }) {
  const [offset, setOffset] = useState(0);
  const weekStart = addDays(startOfWeek(now), offset * 7);
  const weekEnd = addDays(weekStart, 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const inWeek = withRunning(entries, timer).filter((e) => overlap(e, weekStart, weekEnd, now) > 0);
  const rows = [...new Set(inWeek.map((e) => e.projectId))]
    .map((id) => {
      const cells = days.map((d) => sumIn(inWeek, d, addDays(d, 1), now, (e) => e.projectId === id));
      return { id, project: byId[id], cells, total: cells.reduce((a, b) => a + b, 0) };
    })
    .sort((a, b) => b.total - a.total);
  const dayTotals = days.map((_, i) => rows.reduce((a, r) => a + r.cells[i], 0));
  const weekTotal = dayTotals.reduce((a, b) => a + b, 0);
  const maxCell = Math.max(HOUR, ...rows.flatMap((r) => r.cells));
  const goalMs = (Number(settings.weeklyGoal) || 0) * HOUR;
  const dailyGoal = goalMs / 5;
  const maxDay = Math.max(dailyGoal, HOUR, ...dayTotals) * 1.1;
  const remaining = goalMs - weekTotal;
  const range = `Du ${fmtDate(weekStart, { day: 'numeric', month: 'long' })} au ${fmtDate(addDays(weekStart, 6), { day: 'numeric', month: 'long', year: 'numeric' })}`;

  return (
    <>
      <div className="clp-toolbar">
        <IconButton icon="chevron_left" label="Semaine précédente" onClick={() => setOffset((o) => o - 1)} />
        <IconButton icon="chevron_right" label="Semaine suivante" disabled={offset >= 0} onClick={() => setOffset((o) => Math.min(0, o + 1))} />
        <span className="title-medium">{range}</span>
        {offset === 0 && <span className="clp-tag">Semaine en cours</span>}
        <span className="clp-grow" />
        {offset !== 0 && <Button variant="text" icon="today" onClick={() => setOffset(0)}>Cette semaine</Button>}
        <Button variant="tonal" icon="add" onClick={() => onAdd({ date: offset === 0 ? now : weekStart })}>Ajouter une saisie</Button>
      </div>

      {rows.length === 0 ? (
        <Card variant="outlined" className="clp-card">
          <EmptyState icon="calendar_view_week" title="Semaine vide">Aucune heure enregistrée sur cette période. Lancez le chrono ou ajoutez une saisie à la main.</EmptyState>
        </Card>
      ) : (
        <>
          <Card variant="outlined" className="clp-sheet-card">
            <div className="clp-sheet" role="table" aria-label="Feuille de temps">
              <div className="clp-sheet__row clp-sheet__head" role="row">
                <span role="columnheader" className="label-large">Projet</span>
                {days.map((d) => (
                  <span key={d.toISOString()} role="columnheader" className={sameDay(d, now) ? 'is-today' : ''}>
                    <span className="label-medium">{weekday(d)}</span>
                    <span className="clp-sheet__daynum">{d.getDate()}</span>
                  </span>
                ))}
                <span role="columnheader" className="label-large">Total</span>
              </div>
              {rows.map((r) => (
                <div key={r.id} className="clp-sheet__row" role="row">
                  <span className="clp-sheet__project" role="cell">
                    <Dot project={r.project} />
                    <span className="clp-sheet__name">
                      <span className="body-medium clp-ellipsis">{projectName(r.project)}</span>
                      {r.project?.client && <span className="body-small m3-muted clp-ellipsis">{r.project.client}</span>}
                    </span>
                  </span>
                  {r.cells.map((ms, i) => (
                    <button
                      key={i}
                      type="button"
                      role="cell"
                      className={`clp-cell${ms ? '' : ' is-empty'}`}
                      style={ms ? { background: `color-mix(in srgb, ${colorOf(r.project)} ${Math.round(14 + (26 * ms) / maxCell)}%, transparent)` } : undefined}
                      title={`Ajouter une saisie le ${fmtDate(days[i], { weekday: 'long', day: 'numeric', month: 'long' })}`}
                      onClick={() => onAdd({ projectId: r.id, date: days[i] })}
                    >
                      {ms ? fmtDuration(ms) : '–'}
                    </button>
                  ))}
                  <span className="title-small clp-sheet__total" role="cell">{fmtDuration(r.total)}</span>
                </div>
              ))}
              <div className="clp-sheet__row clp-sheet__foot" role="row">
                <span className="title-small">Total du jour</span>
                {dayTotals.map((ms, i) => (
                  <span key={i} className="title-small">{ms ? fmtDuration(ms) : '–'}</span>
                ))}
                <span className="title-small clp-sheet__grand">{fmtDuration(weekTotal)}</span>
              </div>
            </div>
          </Card>

          <div className="clp-split">
            <Card variant="outlined" className="clp-card clp-goal">
              <SectionTitle>Objectif de la semaine</SectionTitle>
              {goalMs > 0 ? (
                <>
                  <div>
                    <span className="clp-goal__value">{fmtDuration(weekTotal)}</span>{' '}
                    <span className="body-large m3-muted">sur {settings.weeklyGoal} h</span>
                  </div>
                  <LinearProgress value={weekTotal / goalMs} />
                  <div className="body-medium m3-muted">
                    {remaining > 0 ? `Encore ${fmtDuration(remaining)} pour l'atteindre.` : 'Objectif atteint, bravo !'}
                  </div>
                </>
              ) : (
                <div className="body-medium m3-muted">Aucun objectif défini : fixez-en un dans les réglages.</div>
              )}
            </Card>
            <Card variant="outlined" className="clp-card">
              <SectionTitle trailing={dailyGoal > 0 ? <span className="body-small m3-muted">Pointillés : {fmtDuration(dailyGoal)} par jour ouvré</span> : null}>Heures par jour</SectionTitle>
              <div className="clp-bars">
                {days.map((d, i) => (
                  <div key={d.toISOString()} className="clp-bars__col" title={`${weekday(d)} : ${fmtDuration(dayTotals[i])}`}>
                    <div className="clp-bars__stack" style={{ height: `${(dayTotals[i] / maxDay) * 100}%` }}>
                      {rows.filter((r) => r.cells[i]).map((r) => (
                        <span key={r.id} style={{ height: `${(r.cells[i] / dayTotals[i]) * 100}%`, background: colorOf(r.project) }} />
                      ))}
                    </div>
                  </div>
                ))}
                {dailyGoal > 0 && <span className="clp-bars__goal" style={{ bottom: `${(dailyGoal / maxDay) * 100}%` }} />}
              </div>
              <div className="clp-bars__labels label-small m3-muted">
                {days.map((d) => <span key={d.toISOString()} className={sameDay(d, now) ? 'is-today' : ''}>{weekday(d)}</span>)}
              </div>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
