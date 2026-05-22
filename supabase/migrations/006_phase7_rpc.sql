-- Phase 7: ai_usage_daily RPC 함수
-- ai_usage_events는 service_role 전용이므로 SECURITY DEFINER 함수로 집계 제공

CREATE OR REPLACE FUNCTION public.ai_usage_daily(since TIMESTAMPTZ)
RETURNS TABLE (day DATE, total BIGINT, success BIGINT)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    created_at::DATE  AS day,
    COUNT(*)          AS total,
    COUNT(*) FILTER (WHERE status = 'success') AS success
  FROM public.ai_usage_events
  WHERE created_at >= since
  GROUP BY created_at::DATE
  ORDER BY day ASC;
$$;

-- anon/authenticated 모두 호출 가능 (Edge Function에서 인증 후 호출)
GRANT EXECUTE ON FUNCTION public.ai_usage_daily(TIMESTAMPTZ) TO anon, authenticated;
