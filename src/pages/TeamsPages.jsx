import { friendlyQueryError } from '../lib/friendlyError';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, RefreshCw, Users } from 'lucide-react';
import DataState from '../components/DataState';
import IdentityImage from '../components/IdentityImage';
import SectionHeading from '../components/SectionHeading';
import { fetchTeamDetail, fetchTeamsData } from '../lib/publicRecords';
import { formatPoints, sumTeamPoints, sumTeamDeductions, makeTeamStandings } from '../lib/rankings';
import { usePublicData } from '../lib/usePublicData';
import { teamColour } from '../constants/festivalTheme';

export function TeamsPage() {
  const { status, data, error, refresh } = usePublicData(fetchTeamsData, 'teams');

  const totals = status === 'ready'
    ? sumTeamPoints(data.results)
    : new Map();

  const deductions = status === 'ready'
    ? sumTeamDeductions(data.penalties)
    : new Map();

  const ranks =
    status === 'ready' && (data.results.length || data.penalties.length)
      ? new Map(
          makeTeamStandings(
            data.teams,
            data.results,
            data.tieBreakers.filter(
              rule => !rule.division || rule.division === 'Mahdhiyya'
            ),
            data.penalties
          ).map(row => [row.id, row.rank])
        )
      : new Map();

  const counts = new Map();

  if (status === 'ready') {
    for (const student of data.roster) {
      counts.set(
        String(student.team_id),
        (counts.get(String(student.team_id)) || 0) + 1
      );
    }
  }

  return (
    <div className="mx-auto max-w-[1120px] px-5 pb-24 pt-10 sm:px-8 sm:pt-14 lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Groups / KALAM 2K26"
          title="Teams"
          description="Meet the groups competing across the festival."
        />

        <button
          onClick={refresh}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-xs font-bold text-navy hover:bg-page"
        >
          <RefreshCw size={14} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {status === 'loading' ? (
        <DataState status="loading" />
      ) : status === 'offline' ? (
        <DataState status="offline" onRetry={refresh} />
      ) : status === 'error' ? (
        <DataState
          status="error"
          description={friendlyQueryError(error)}
          onRetry={refresh}
        />
      ) : !data.teams.length ? (
        <DataState
          status="empty"
          title="No teams added yet"
          description="Team profiles will appear when organisers add them."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.teams.map(team => (
            <Link
              key={team.id}
              to={`/teams/${encodeURIComponent(team.id)}`}
              style={{ borderTopColor: teamColour(team.name).fill }}
              className="group flex min-h-56 flex-col rounded-panel border border-line border-t-[6px] bg-white p-6 shadow-panel transition-shadow duration-fast hover:shadow-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-burgundy"
            >
              <div className="flex items-start justify-between gap-3">
                <IdentityImage
                  src={team.logo_url}
                  name={team.name}
                  className="h-16 w-40 max-w-[calc(100%-3.25rem)]"
                />

                {ranks.has(String(team.id)) && (
                  <span
                    className="grid h-10 w-10 place-items-center rounded-[13px] bg-glaze-500 font-display text-sm font-extrabold text-clay-900"
                    aria-label={`Rank ${ranks.get(String(team.id))}`}
                  >
                    {ranks.get(String(team.id))}
                  </span>
                )}
              </div>

              <h2 className="mt-5 text-xl font-bold tracking-tight text-navy group-hover:text-burgundy">
                {team.name}
              </h2>

              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                <Users size={14} aria-hidden="true" />
                {counts.get(String(team.id)) || 0} students
              </p>

              {(deductions.get(String(team.id)) || 0) > 0 && (
                <p className="mt-2 text-xs font-semibold text-muted">
                  Minus marks: {formatPoints(deductions.get(String(team.id)) / 100)} pts
                </p>
              )}

              <div className="mt-auto flex items-end justify-between border-t border-line pt-5">
                <p className="text-lg font-extrabold tabular-nums text-navy">
                  {formatPoints(
                    (
                      (totals.get(String(team.id)) || 0) -
                      (deductions.get(String(team.id)) || 0)
                    ) / 100
                  )}{' '}
                  <span className="text-xs font-medium text-muted">net pts</span>
                </p>

                <ArrowRight size={18} className="text-burgundy" aria-hidden="true" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function TeamDetailPage() {
  const { id } = useParams();
  const { status, data, error, refresh } = usePublicData(
    () => fetchTeamDetail(id),
    id
  );

  const team = data?.team;

  return (
    <div className="mx-auto max-w-[1120px] px-5 pb-24 pt-10 sm:px-8 sm:pt-14 lg:px-10">
      <Link
        to="/teams"
        className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-burgundy hover:underline"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to teams
      </Link>

      {!team && <h1 className="sr-only">Team details</h1>}

      {status === 'loading' ? (
        <DataState status="loading" />
      ) : status === 'offline' ? (
        <DataState status="offline" onRetry={refresh} />
      ) : status === 'error' ? (
        <DataState
          status="error"
          description={friendlyQueryError(error)}
          onRetry={refresh}
        />
      ) : !team ? (
        <DataState
          status="empty"
          title="Team not found"
          description="This team may not exist."
        />
      ) : (
        <>
          <section
            style={{ borderTopColor: teamColour(team.name).fill }}
            className="flex flex-wrap items-center gap-5 rounded-panel border border-line border-t-[6px] bg-white p-6 shadow-panel sm:p-8"
          >
            <IdentityImage
              src={team.logo_url}
              name={team.name}
              className="h-20 w-48 max-w-full sm:h-24 sm:w-56"
            />

            <div>
              <p className="text-xs font-bold text-burgundy">KALAM / Team</p>

              <h1 className="mt-2 text-[2rem] font-extrabold tracking-[-.04em] text-navy sm:text-[2.5rem]">
                {team.name}
              </h1>

              <p className="mt-2 flex items-center gap-2 text-sm text-muted">
                <Users size={16} aria-hidden="true" />
                {data.roster.length} students
              </p>
            </div>
          </section>

          <section className="mt-5 rounded-panel border border-line bg-white p-5 shadow-soft sm:p-7">
            <h2 className="text-lg font-bold text-navy">Team points</h2>

            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted">Published points earned</dt>
                <dd className="font-bold text-navy">
                  {formatPoints(
                    (sumTeamPoints(data.results).get(String(id)) || 0) / 100
                  )}
                </dd>
              </div>

              <div>
                <dt className="text-muted">Team minus marks</dt>
                <dd className="font-bold text-navy">
                  −{formatPoints(Number(data.penalty?.deduction_points || 0))}
                </dd>
              </div>

              <div>
                <dt className="text-muted">Net team points</dt>
                <dd className="text-lg font-extrabold text-navy">
                  {formatPoints(
                    (sumTeamPoints(data.results).get(String(id)) || 0) / 100 -
                      Number(data.penalty?.deduction_points || 0)
                  )}
                </dd>
              </div>
            </dl>

            {!data.results.length && !data.penalty && (
              <p className="mt-4 text-xs text-muted">
                No published points or team deductions yet.
              </p>
            )}

            <p className="mt-3 text-xs text-muted">
              Team deductions do not change students’ individual points.
            </p>
          </section>

          <section className="mt-7">
            <h2 className="mb-4 text-xl font-bold text-navy">Students</h2>

            {!data.roster.length ? (
              <DataState
                status="empty"
                title="No students yet"
                description="The team roster is currently empty."
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {data.roster.map(student => (
                  <article
                    key={student.student_id}
                    className="flex items-center gap-4 rounded-panel border border-line bg-white p-4 shadow-soft sm:p-5"
                  >
                    <IdentityImage
                      src={student.photo_url}
                      name={student.student_name}
                      kind="student"
                      className="h-14 w-14"
                    />

                    <div className="min-w-0">
                      <h3 className="break-words text-sm font-bold text-navy">
                        {student.student_name}
                      </h3>

                      {student.roll_number && (
                        <p className="mt-1 text-xs text-muted">
                          Roll no. {student.roll_number}
                        </p>
                      )}

                      <p className="mt-1 text-xs text-muted">
                        {student.division}
                        {student.is_attc ? ' · ATTC category' : ''}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
