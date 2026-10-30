// A scoring key is independent of Mahdhiyya division, ATTC membership, and result grade.
export function eventScoringKey(event) {
  if (!event) return null;
  if (event.competition_type === 'General') return ['A', 'B'].includes(event.scoring_category) ? `General ${event.scoring_category}` : null;
  if (event.competition_type === 'ATTC') return ['On-stage', 'Non-stage'].includes(event.stage_type) ? event.stage_type : null;
  return ['On-stage', 'Non-stage'].includes(event.competition_type) ? event.competition_type : null;
}
