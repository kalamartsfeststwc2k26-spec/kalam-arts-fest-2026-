import { friendlyQueryError } from '../lib/friendlyError';
import { useMemo, useState } from 'react';
import { Medal, RefreshCw, Trophy } from 'lucide-react';
import DataState from '../components/DataState';
import IdentityImage from '../components/IdentityImage';
import SectionHeading from '../components/SectionHeading';
import { fetchStandingsData } from '../lib/publicRecords';
import { formatPoints, makeIndividualStandings, makeTeamStandings } from '../lib/rankings';
import { usePublicData } from '../lib/usePublicData';
import { teamColour } from '../constants/festivalTheme';

function TeamPodium({rows}) {
  const ordered=[rows[1],rows[0],rows[2]].filter(Boolean);
  return <section aria-label="Top team podium" className="kiln mb-6 rounded-[22px] bg-clay-900 px-5 pb-6 pt-6 text-on-kiln sm:px-8"><h2 className="font-display text-xl font-bold text-on-kiln">Top teams</h2><p className="mt-1 text-sm text-on-kiln-muted">Net points after any team minus marks.</p><ol className="mt-5 grid grid-cols-3 items-end gap-2 sm:gap-4">{ordered.map(row=>{const colour=teamColour(row.name);const height=row.rank===1?'min-h-[150px]':row.rank===2?'min-h-[112px]':'min-h-[92px]';return <li key={row.id} className={`flex min-w-0 flex-col justify-between rounded-t-2xl border-2 border-clay-900 p-2.5 text-ink shadow-sticker sm:p-4 ${height}`} style={{backgroundColor:colour.fill,color:colour.podiumText}}><span className="text-xs font-extrabold">Rank {row.rank}</span><span className="break-words font-display text-xs font-bold sm:text-base">{row.name}</span><strong className="whitespace-nowrap font-display text-sm font-extrabold tabular-nums sm:text-xl">{formatPoints(row.points)} <small className="text-xs">pts</small></strong></li>;})}</ol></section>;
}

function StandingsList({ rows, mode }) {
  return <ol className="divide-y divide-line">{rows.map(row => <li key={row.id} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0 sm:gap-5">
    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-extrabold tabular-nums ${row.rank === 1 ? 'border-2 border-clay-900 bg-glaze-500 text-clay-900' : row.rank === 2 ? 'bg-silver text-clay-900' : row.rank === 3 ? 'bg-clay-500 text-white' : 'bg-paper text-clay-800'}`} aria-label={`Rank ${row.rank}`}>{row.rank}</span>
    {mode === 'teams' && <IdentityImage src={row.logo_url} name={row.name} className="h-11 w-11" />}
    <div className="min-w-0 flex-1"><p className="break-words text-sm font-bold text-navy sm:text-base">{row.name}</p><p className="mt-0.5 text-xs font-semibold text-muted">{row.tied ? `Shared rank ${row.rank}` : `Rank ${row.rank}`}{mode === 'individuals' && row.teamName ? ` · ${row.teamName}` : ''}{mode === 'teams' && row.deductionPoints > 0 ? ` · Earned ${formatPoints(row.earnedPoints)} − minus ${formatPoints(row.deductionPoints)} points` : ''}</p></div>
    <span className="whitespace-nowrap text-right text-lg font-extrabold tabular-nums text-navy">{formatPoints(row.points)} <span className="text-xs font-medium text-muted">pts</span></span>
  </li>)}</ol>;
}

export default function LeaderboardPage() {
  const { status, data, error, refresh } = usePublicData(fetchStandingsData, 'leaderboard');
  const [mode, setMode] = useState('teams');
  const rules = useMemo(() => status !== 'ready' ? [] : data.tieBreakers.filter(rule => rule.scope === mode && (!rule.division || rule.division === 'Mahdhiyya')), [status, data, mode]);
  const hasScoredResults = status === 'ready' && (data.results.some(row => Number(row.points) > 0 && (mode === 'teams' ? row.team_id != null : row.student_id != null)) || (mode === 'teams' && data.penalties.length > 0));
  const rows = useMemo(() => status !== 'ready' || !hasScoredResults ? [] : mode === 'teams' ? makeTeamStandings(data.teams, data.results, rules, data.penalties) : makeIndividualStandings(data.results, rules), [status, data, mode, rules, hasScoredResults]);
  const titles = useMemo(() => status !== 'ready' ? [] : data.titles, [status, data]);
  const groups = useMemo(() => Object.groupBy ? Object.groupBy(titles, title => title.title_type) : titles.reduce((map, title) => { (map[title.title_type] ||= []).push(title); return map; }, {}), [titles]);

  return <div className="mx-auto max-w-[1120px] px-5 pb-24 pt-10 sm:px-8 sm:pt-14 lg:px-10">
    <div className="flex flex-wrap items-end justify-between gap-4"><SectionHeading eyebrow="Standings / KALAM 2K26" title="Leaderboard" description="Team totals subtract Super Admin-applied minus marks; individual points are unchanged. Equal totals share a rank unless an approved tie-break rule applies." /><button onClick={refresh} className="mb-8 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-xs font-bold text-navy hover:bg-page"><RefreshCw size={14} aria-hidden="true" />Refresh</button></div>

    <div className="mb-6 flex flex-wrap items-end justify-between gap-5 rounded-panel border border-line bg-white p-5 shadow-soft sm:p-6"><div role="group" aria-label="Leaderboard view" className="flex gap-2 overflow-x-auto"><button aria-pressed={mode === 'teams'} onClick={() => setMode('teams')} className={`rounded-full border border-line px-4 py-2.5 text-sm font-bold transition-colors ${mode === 'teams' ? 'border-clay-700 bg-clay-700 text-white' : 'bg-white text-muted hover:text-clay-800'}`}>Groups / Teams</button><button aria-pressed={mode === 'individuals'} onClick={() => setMode('individuals')} className={`rounded-full border border-line px-4 py-2.5 text-sm font-bold transition-colors ${mode === 'individuals' ? 'border-clay-700 bg-clay-700 text-white' : 'bg-white text-muted hover:text-clay-800'}`}>Individuals</button></div><span className="text-xs font-semibold text-muted">Mahdhiyya division</span></div>

    {status === 'loading' ? <DataState status="loading" /> : status === 'offline' ? <DataState status="offline" onRetry={refresh} /> : status === 'error' ? <DataState status="error" description={friendlyQueryError(error)} onRetry={refresh} /> : <>
      {mode === 'teams' && rows.length > 0 && <TeamPodium rows={rows} />}

      <section className="rounded-panel border border-line bg-white p-5 shadow-soft sm:p-8"><div className="mb-5 flex items-center gap-2 border-b border-line pb-5"><Trophy size={19} className="text-burgundy" aria-hidden="true" /><h2 className="text-xl font-bold text-navy">{mode === 'teams' ? 'Group / Team standings' : 'Individual standings'}</h2></div>{rows.length ? <StandingsList rows={rows} mode={mode} /> : <p className="rounded-xl bg-page px-5 py-8 text-center text-sm text-muted">{mode === 'teams' && !data.teams.length ? 'No teams have been added yet.' : `No published ${mode === 'teams' ? 'team' : 'individual'} points yet.`}</p>}</section>

      <section className="mt-7 rounded-panel border border-line bg-white p-5 shadow-soft sm:p-8"><div className="mb-5 flex items-center gap-2 border-b border-line pb-5"><Medal size={19} className="text-burgundy" aria-hidden="true" /><h2 className="text-xl font-bold text-navy">Special Titles</h2></div>{!titles.length ? <p className="rounded-xl bg-page px-5 py-8 text-center text-sm text-muted">No special titles published yet.</p> : <div className="grid gap-6 sm:grid-cols-2">{Object.entries(groups).map(([type, awards]) => <div key={type} className="rounded-xl border border-line p-5"><h3 className="text-sm font-bold text-burgundy">{type}</h3><ul className="mt-3 divide-y divide-line">{awards.map(award => <li key={award.id} className="py-3 first:pt-0 last:pb-0"><p className="text-sm font-bold text-navy">{award.award_title}</p><p className="mt-1 text-sm text-muted">{award.recipient_name} <span className="text-xs">· {award.recipient_kind}{award.division ? ` · ${award.division}` : ''}</span></p></li>)}</ul></div>)}</div>}</section>
    </>}
  </div>;
}
