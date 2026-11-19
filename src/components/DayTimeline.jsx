// Frise de la journée : chaque session est un bloc coloré, la ligne rouge marque l'heure actuelle.
import { Card } from '../m3/index.jsx';
import { Dot, SectionTitle } from './bits.jsx';
import { HOUR, addDays, fmtDuration, fmtTime, startOfDay } from '../lib/time.js';
import { endOf, overlap } from '../lib/stats.js';
import { colorOf, projectName } from '../data.js';

export default function DayTimeline({ entries, byId, now, total }) {
  const day = startOfDay(now);
  const next = addDays(day, 1);
  const items = entries
    .filter((e) => overlap(e, day, next, now) > 0)
    .map((e) => ({ e, s: Math.max(new Date(e.start).getTime(), +day), en: Math.min(endOf(e, now), +next) }));

  let first = 8;
  let last = Math.max(19, now.getHours() + 1);
  items.forEach(({ s, en }) => {
    first = Math.min(first, new Date(s).getHours());
    if (en >= +next) last = 24;
    else {
      const end = new Date(en);
      last = Math.max(last, end.getHours() + (end.getMinutes() || end.getSeconds() ? 1 : 0));
    }
  });
  last = Math.min(24, last);
  const from = +day + first * HOUR;
  const span = (last - first) * HOUR;
  const pct = (t) => ((t - from) / span) * 100;
  const hours = Array.from({ length: last - first + 1 }, (_, i) => first + i);
  const step = hours.length > 14 ? 2 : 1;
  const legend = [...new Set(items.map((i) => i.e.projectId))];

  return (
    <Card variant="outlined" className="clp-card">
      <SectionTitle trailing={<span className="label-large m3-muted">{fmtDuration(total)} au total</span>}>Ma journée</SectionTitle>
      <div className="clp-timeline">
        <div className="clp-timeline__track">
          {hours.slice(1, -1).map((h) => (
            <span key={h} className="clp-timeline__grid" style={{ left: `${pct(+day + h * HOUR)}%` }} />
          ))}
          {items.map(({ e, s, en }) => (
            <span
              key={e.id}
              className={`clp-timeline__block${e.end ? '' : ' is-running'}`}
              style={{ left: `${pct(s)}%`, width: `calc(${pct(en) - pct(s)}% - 2px)`, backgroundColor: colorOf(byId[e.projectId]) }}
              title={`${projectName(byId[e.projectId])} · ${fmtTime(s)} – ${e.end ? fmtTime(en) : 'en cours'}`}
            />
          ))}
          <span className="clp-timeline__now" style={{ left: `${pct(+now)}%` }} title={`Maintenant : ${fmtTime(now)}`} />
        </div>
        <div className="clp-timeline__labels">
          {hours.filter((_, i) => i % step === 0).map((h) => (
            <span key={h} style={{ left: `${pct(+day + h * HOUR)}%` }}>{h} h</span>
          ))}
        </div>
      </div>
      {legend.length > 0 ? (
        <div className="clp-legend body-small">
          {legend.map((id) => (
            <span key={id}><Dot project={byId[id]} size={10} />{projectName(byId[id])}</span>
          ))}
        </div>
      ) : (
        <div className="body-medium m3-muted">Rien de chronométré aujourd'hui pour l'instant.</div>
      )}
    </Card>
  );
}
