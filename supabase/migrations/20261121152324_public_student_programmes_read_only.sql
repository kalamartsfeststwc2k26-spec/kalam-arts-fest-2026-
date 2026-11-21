CREATE VIEW public.public_student_programmes WITH (security_barrier = true) AS
SELECT r.student_id, e.id AS event_id, e.name AS event_name,
       e.competition_type, e.item_category, e.venue,
       e.start_time, e.end_time, e.day_label
FROM public.registrations AS r
JOIN public.events AS e ON e.id = r.event_id
WHERE e.is_published IS TRUE;
REVOKE ALL ON public.public_student_programmes FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.public_student_programmes TO anon, authenticated;