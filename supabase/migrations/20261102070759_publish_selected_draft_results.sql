-- Publish only explicitly selected drafts in one transaction. Existing result
-- RLS, result validation, point calculation and audit triggers stay in place.
CREATE OR REPLACE FUNCTION public.publish_selected_draft_results(p_result_ids uuid[])
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  requested_count integer;
  matched_count integer;
  updated_count integer;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Only an active Super Admin can publish results.'
      USING ERRCODE = '42501';
  END IF;

  requested_count := COALESCE(cardinality(p_result_ids), 0);

  IF requested_count = 0
     OR requested_count > 500
     OR array_position(p_result_ids, NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'Select between 1 and 500 distinct draft results.'
      USING ERRCODE = '22023';
  END IF;

  IF (
    SELECT count(DISTINCT id)
    FROM unnest(p_result_ids) AS selected(id)
  ) <> requested_count THEN
    RAISE EXCEPTION 'Duplicate result IDs are not allowed.'
      USING ERRCODE = '22023';
  END IF;

  -- Stable ordering reduces lock-order deadlocks between competing publishers.
  PERFORM r.id
  FROM public.results r
  WHERE r.id = ANY(p_result_ids)
  ORDER BY r.id
  FOR UPDATE;

  SELECT count(*)
  INTO matched_count
  FROM public.results r
  WHERE r.id = ANY(p_result_ids)
    AND r.status = 'draft';

  IF matched_count <> requested_count THEN
    RAISE EXCEPTION
      'A selected result is missing or is no longer a draft. Refresh and review the selection.'
      USING ERRCODE = '23514';
  END IF;

  -- Prevent event publication status changing between the check and update.
  PERFORM e.id
  FROM public.events e
  WHERE e.id IN (
    SELECT r.event_id
    FROM public.results r
    WHERE r.id = ANY(p_result_ids)
  )
  ORDER BY e.id
  FOR SHARE;

  IF EXISTS (
    SELECT 1
    FROM public.results r
    LEFT JOIN public.events e ON e.id = r.event_id
    WHERE r.id = ANY(p_result_ids)
      AND (e.id IS NULL OR NOT e.is_published)
  ) THEN
    RAISE EXCEPTION
      'Publish every selected result’s event first, then refresh and review.'
      USING ERRCODE = '23514';
  END IF;

  UPDATE public.results
  SET status = 'published',
      published_at = statement_timestamp()
  WHERE id = ANY(p_result_ids)
    AND status = 'draft';

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  IF updated_count <> requested_count THEN
    RAISE EXCEPTION
      'The selection changed; no results were published. Refresh and review.'
      USING ERRCODE = '23514';
  END IF;

  RETURN updated_count;
END
$function$;

REVOKE ALL ON FUNCTION public.publish_selected_draft_results(uuid[])
  FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.publish_selected_draft_results(uuid[])
  TO authenticated;
