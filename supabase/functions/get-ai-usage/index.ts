import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CORS, optionsOk, errResponse } from "../_shared/utils.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsOk();

  // JWT 인증 확인
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });
  }

  // 사용자 클라이언트로 인증 검증
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });
  }

  // Service role 클라이언트로 통계 조회
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const since7d  = new Date(Date.now() -  7 * 24 * 60 * 60 * 1000).toISOString();

    const [all30, perProvider, daily7] = await Promise.all([
      // 30일 전체 요약
      supabase
        .from("ai_usage_events")
        .select("status, duration_ms, provider")
        .gte("created_at", since30d),

      // 프로바이더별 집계
      supabase
        .from("ai_usage_events")
        .select("provider, model, status, duration_ms, retry_count")
        .gte("created_at", since30d),

      // 일별 호출 수 (최근 7일) — created_at::date로 그룹화
      supabase.rpc("ai_usage_daily", { since: since7d }),
    ]);

    const events = all30.data ?? [];
    const total  = events.length;
    const success = events.filter((e) => e.status === "success").length;
    const avgDuration = total > 0
      ? Math.round(events.filter((e) => e.status === "success").reduce((s, e) => s + e.duration_ms, 0) / Math.max(success, 1))
      : 0;

    // 프로바이더별 집계 (클라이언트에서 계산)
    const providerMap: Record<string, { total: number; success: number; avgMs: number; model: string }> = {};
    for (const e of perProvider.data ?? []) {
      if (!providerMap[e.provider]) {
        providerMap[e.provider] = { total: 0, success: 0, avgMs: 0, model: e.model };
      }
      providerMap[e.provider].total++;
      if (e.status === "success") {
        providerMap[e.provider].success++;
        providerMap[e.provider].avgMs += e.duration_ms;
      }
    }
    const providers = Object.entries(providerMap).map(([name, v]) => ({
      name,
      model: v.model,
      total: v.total,
      success: v.success,
      successRate: v.total > 0 ? Math.round((v.success / v.total) * 100) : 0,
      avgMs: v.success > 0 ? Math.round(v.avgMs / v.success) : 0,
    }));

    // 감성분석 캐시 수 (분석된 영화 수)
    const { count: cachedMovies } = await supabase
      .from("sentiment_cache")
      .select("*", { count: "exact", head: true });

    return new Response(
      JSON.stringify({
        summary: { total, success, successRate: total > 0 ? Math.round((success / total) * 100) : 0, avgDuration, cachedMovies: cachedMovies ?? 0 },
        providers,
        daily: daily7.data ?? [],
      }),
      { headers: CORS }
    );
  } catch (err) {
    return errResponse(err);
  }
});
