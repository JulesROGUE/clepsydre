// Rapport : temps et montants par période, répartition par projet, détail et export CSV.
import { useState } from 'react';
import { Button, Card, Chip, EmptyState, SegmentedButton } from '../m3/index.jsx';
import { Dot, SectionTitle, StatCard } from '../components/bits.jsx';
import { saveTextFile } from '../lib/files.js';
import { addDays, addMonths, fmtDate, fmtDecimalHours, fmtDuration, fmtMoney, fmtTime, startOfMonth, startOfWeek, toDateInput } from '../lib/time.js';
import { amount, overlap, roundMs } from '../lib/stats.js';
import { colorOf, projectName } from '../data.js';

const PERIODS = [
  { value: 'week', label: 'Cette semaine' },
  { value: 'month', label: 'Ce mois' },
  { value: 'last', label: 'Mois dernier' },
  { value: 'all', label: 'Tout' },
];
const MAX_ROWS = 40;

function rangeOf(period, now) {
  if (period === 'week') {
    const s = startOfWeek(now);
    return [s, addDays(s, 7)];
  }
  if (period === 'month') {
    const s = startOfMonth(now);
    return [s, addMonths(s, 1)];
  }
  if (period === 'last') {
    const s = addMonths(startOfMonth(now), -1);
    return [s, startOfMonth(now)];
  }
  return [new Date(0), addDays(now, 1)];
}

// Cellule CSV (séparateur « ; » pour Excel en français), protégée contre l'injection de formules.
function csvCell(v) {
  let s = String(v ?? '');
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export default function ReportView({ byId, entries, timer, now, settings, onNotify }) {
  const [period, setPeriod] = useState('month');
  const [billableOnly, setBillableOnly] = useState(false);
  const [from, to] = rangeOf(period, now);
  const cur = settings.currency;
  const roundTo = Number(settings.roundTo) || 0;

  const rows = entries
    .filter((e) => e.end && overlap(e, from, to, now) > 0 && (!billableOnly || byId[e.projectId]?.billable))
    .map((e) => {
      const p = byId[e.projectId];
      const ms = roundMs(overlap(e, from, to, now), roundTo);
      return { e, p, ms, amount: amount(ms, p) };
    })
    .sort((a, b) => new Date(b.e.start) - new Date(a.e.start));

  const total = rows.reduce((a, r) => a + r.ms, 0);
  const billable = rows.reduce((a, r) => a + (r.p?.billable ? r.ms : 0), 0);
  const money = rows.reduce((a, r) => a + r.amount, 0);
  const days = new Set(rows.map((r) => toDateInput(r.e.start))).size;
  const groups = Object.values(
    rows.reduce((acc, r) => {
      const g = acc[r.e.projectId] || (acc[r.e.projectId] = { id: r.e.projectId, p: r.p, ms: 0, amount: 0, count: 0 });
      g.ms += r.ms;
      g.amount += r.amount;
      g.count += 1;
      return acc;
    }, {}),
  ).sort((a, b) => b.ms - a.ms);
  const maxMs = groups[0]?.ms || 1;

  const exportCsv = async () => {
    const head = ['Date', 'Début', 'Fin', 'Projet', 'Client', 'Description', 'Durée (h)', 'Taux horaire', 'Montant'];
    const lines = [...rows].reverse().map((r) => [
      fmtDate(r.e.start, { day: '2-digit', month: '2-digit', year: 'numeric' }),
      fmtTime(r.e.start),
      fmtTime(r.e.end),
      projectName(r.p),
      r.p?.client || '',
      r.e.note || '',
      fmtDecimalHours(r.ms),
      r.p?.billable ? String(r.p.rate).replace('.', ',') : '',
      r.p?.billable ? r.amount.toFixed(2).replace('.', ',') : '',
    ]);
    const csv = `﻿${[head, ...lines].map((l) => l.map(csvCell).join(';')).join('\r\n')}`;
    try {
      const res = await saveTextFile(`clepsydre-rapport-${period}-${toDateInput(now)}.csv`, csv, [{ name: 'Fichier CSV', extensions: ['csv'] }]);
      if (res?.saved) onNotify(`Rapport exporté : ${rows.length} sessions.`);
    } catch {
      onNotify("L'export a échoué. Vérifiez le dossier choisi.");
    }
  };

  return (
    <>
      <div className="clp-toolbar">
        <SegmentedButton options={PERIODS} value={period} onChange={setPeriod} />
        <Chip icon="filter_alt" selected={billableOnly} onClick={() => setBillableOnly((b) => !b)}>Facturable uniquement</Chip>
        <span className="clp-grow" />
        <Button variant="tonal" icon="download" disabled={rows.length === 0} onClick={exportCsv}>Exporter en CSV</Button>
      </div>

      {rows.length === 0 ? (
        <Card variant="outlined" className="clp-card">
          <EmptyState icon="bar_chart" title="Rien à afficher">
            Aucune session terminée sur cette période{billableOnly ? ' pour les projets facturables' : ''}.
          </EmptyState>
        </Card>
      ) : (
        <>
          <div className="clp-stats clp-stats--4">
            <StatCard icon="schedule" label="Temps total" value={fmtDuration(total)} sub={`${rows.length} session${rows.length > 1 ? 's' : ''}`} />
            <StatCard icon="work" label="Temps facturable" value={fmtDuration(billable)} sub={`${Math.round((billable / total) * 100)} % du temps total`} />
            <StatCard icon="payments" label="Montant estimé" value={fmtMoney(money, cur)} sub="Selon les taux de vos projets" />
            <StatCard icon="timelapse" label="Moyenne par jour" value={fmtDuration(total / days)} sub={`${days} jour${days > 1 ? 's' : ''} travaillé${days > 1 ? 's' : ''}`} />
          </div>

          <Card variant="outlined" className="clp-card">
            <SectionTitle>Répartition par projet</SectionTitle>
            <div className="clp-breakdown">
              {groups.map((g) => (
                <div key={g.id} className="clp-breakdown__row">
                  <div className="clp-breakdown__name">
                    <Dot project={g.p} />
                    <div className="clp-ellipsis">
                      <div className="body-medium clp-ellipsis">{projectName(g.p)}</div>
                      <div className="body-small m3-muted clp-ellipsis">{g.p?.client || `${g.count} session${g.count > 1 ? 's' : ''}`}</div>
                    </div>
                  </div>
                  <div className="clp-breakdown__bar"><span style={{ width: `${(g.ms / maxMs) * 100}%`, background: colorOf(g.p) }} /></div>
                  <div className="title-small clp-num">{fmtDuration(g.ms)}</div>
                  <div className="body-medium clp-num m3-muted">{g.p?.billable ? fmtMoney(g.amount, cur) : 'Non facturé'}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card variant="outlined" className="clp-card">
            <SectionTitle trailing={roundTo ? <span className="clp-tag">Arrondi : {roundTo} min par session</span> : null}>Détail des sessions</SectionTitle>
            <div className="clp-table" role="table" aria-label="Détail des sessions">
              <div className="clp-table__row clp-table__head label-medium" role="row">
                <span>Date</span><span>Projet</span><span>Description</span><span>Horaires</span><span className="clp-num">Durée</span><span className="clp-num">Montant</span>
              </div>
              {rows.slice(0, MAX_ROWS).map((r) => (
                <div key={r.e.id} className="clp-table__row body-medium" role="row">
                  <span className="clp-ellipsis">{fmtDate(r.e.start, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                  <span className="clp-inline"><Dot project={r.p} size={10} /><span className="clp-ellipsis">{projectName(r.p)}</span></span>
                  <span className="clp-ellipsis m3-muted">{r.e.note || 'Sans description'}</span>
                  <span className="m3-muted clp-tabular">{fmtTime(r.e.start)} – {fmtTime(r.e.end)}</span>
                  <span className="clp-num">{fmtDuration(r.ms)}</span>
                  <span className="clp-num m3-muted">{r.p?.billable ? fmtMoney(r.amount, cur) : '—'}</span>
                </div>
              ))}
            </div>
            {rows.length > MAX_ROWS && (
              <div className="body-small m3-muted clp-more">… et {rows.length - MAX_ROWS} autres sessions, toutes incluses dans l'export CSV.</div>
            )}
          </Card>
          {timer && <div className="body-small m3-muted">La session en cours sera comptée dès l'arrêt du chrono.</div>}
        </>
      )}
    </>
  );
}
