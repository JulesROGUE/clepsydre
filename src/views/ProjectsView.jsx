// Projets : taux horaire, temps du mois, montant à facturer et suivi du budget.
import { useState } from 'react';
import { Button, Card, EmptyState, Icon, IconButton, LinearProgress, SegmentedButton } from '../m3/index.jsx';
import { HOUR, addMonths, fmtDuration, fmtMoney, startOfMonth } from '../lib/time.js';
import { amount, durationOf, overlap, withRunning } from '../lib/stats.js';
import { colorOf, initials } from '../data.js';

export default function ProjectsView({ projects, entries, timer, now, settings, onNew, onEdit, onArchive, onDelete, onStart }) {
  const [tab, setTab] = useState('actifs');
  const activeCount = projects.filter((p) => !p.archived).length;
  const list = projects.filter((p) => (tab === 'actifs' ? !p.archived : p.archived));
  const all = withRunning(entries, timer);
  const month = startOfMonth(now);
  const next = addMonths(month, 1);
  const cur = settings.currency;

  const stats = (p) => {
    const mine = all.filter((e) => e.projectId === p.id);
    return {
      total: mine.reduce((a, e) => a + durationOf(e, now), 0),
      monthMs: mine.reduce((a, e) => a + overlap(e, month, next, now), 0),
      count: mine.filter((e) => e.end).length,
    };
  };

  return (
    <>
      <div className="clp-toolbar">
        <SegmentedButton
          options={[
            { value: 'actifs', label: `En cours (${activeCount})` },
            { value: 'archives', label: `Archivés (${projects.length - activeCount})` },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {list.length === 0 ? (
        <Card variant="outlined" className="clp-card">
          {tab === 'actifs' ? (
            <EmptyState icon="folder_open" title="Aucun projet en cours" action={<Button icon="add" onClick={onNew}>Nouveau projet</Button>}>
              Créez un projet par client, mission ou matière, avec son taux horaire et, si besoin, un budget en heures.
            </EmptyState>
          ) : (
            <EmptyState icon="inventory_2" title="Aucun projet archivé">
              Archivez un projet terminé pour alléger la liste sans perdre son historique.
            </EmptyState>
          )}
        </Card>
      ) : (
        <div className="clp-projects">
          {list.map((p) => {
            const s = stats(p);
            const ratio = p.budgetHours > 0 ? s.total / (p.budgetHours * HOUR) : 0;
            const running = timer?.projectId === p.id;
            return (
              <Card key={p.id} variant="outlined" className="clp-project" style={{ '--c': colorOf(p) }}>
                <div className="clp-project__head">
                  <span className="clp-project__badge">{initials(p.name)}</span>
                  <div className="clp-project__title">
                    <div className="title-medium clp-ellipsis">{p.name}</div>
                    <div className="body-medium m3-muted clp-ellipsis">{p.client || 'Sans client'}</div>
                  </div>
                  {!p.archived && !running && (
                    <IconButton icon="play_arrow" variant="tonal" label={`Démarrer le chrono sur « ${p.name} »`} onClick={() => onStart(p.id)} />
                  )}
                </div>
                <div className="clp-tags">
                  {running && <span className="clp-tag clp-tag--live"><span className="clp-pulse" />Chrono en cours</span>}
                  <span className="clp-tag">
                    <Icon name={p.billable ? 'payments' : 'money_off'} size={16} />
                    {p.billable ? `${fmtMoney(p.rate, cur, 2)} / h` : 'Non facturable'}
                  </span>
                  <span className="clp-tag"><Icon name="history" size={16} />{s.count} session{s.count > 1 ? 's' : ''}</span>
                </div>
                <div className="clp-project__figures">
                  <div>
                    <div className="label-medium m3-muted">Ce mois-ci</div>
                    <div className="title-large">{fmtDuration(s.monthMs)}</div>
                  </div>
                  <div>
                    <div className="label-medium m3-muted">À facturer</div>
                    <div className="title-large">{p.billable ? fmtMoney(amount(s.monthMs, p), cur) : '—'}</div>
                  </div>
                  <div>
                    <div className="label-medium m3-muted">Depuis le début</div>
                    <div className="title-large">{fmtDuration(s.total)}</div>
                  </div>
                </div>
                {p.budgetHours > 0 && (
                  <div className="clp-budget">
                    <LinearProgress value={Math.min(1, ratio)} className={ratio >= 1 ? 'is-over' : ratio >= 0.85 ? 'is-warn' : ''} />
                    <div className={`body-small ${ratio >= 1 ? 'clp-error' : 'm3-muted'}`}>
                      {fmtDuration(s.total)} sur {p.budgetHours} h budgétées
                      {ratio >= 1 ? ' · budget dépassé' : ratio >= 0.85 ? ' · bientôt atteint' : ` · ${Math.round(ratio * 100)} %`}
                    </div>
                  </div>
                )}
                <div className="clp-project__actions">
                  <Button variant="text" icon="edit" onClick={() => onEdit(p)}>Modifier</Button>
                  <Button variant="text" icon={p.archived ? 'unarchive' : 'archive'} onClick={() => onArchive(p.id, !p.archived)}>
                    {p.archived ? 'Réactiver' : 'Archiver'}
                  </Button>
                  {s.count === 0 && !running && <Button variant="text" icon="delete" onClick={() => onDelete(p.id)}>Supprimer</Button>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
