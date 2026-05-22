import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CORS, optionsOk, errResponse } from "../_shared/utils.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsOk();

  try {
    const { movie_id, title, ui_language = "ko-KR", force_refresh = false } = await req.json();

    if (!movie_id || !title) {
      return new Response(
        JSON.stringify({ error: "movie_id and title are required" }),
        { status: 400, headers: CORS }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // DB 캐시 확인 (force_refresh가 아닌 경우)
    if (!force_refresh) {
      const { data: cached } = await supabase
        .from("sentiment_cache")
        .select("data")
        .eq("movie_id", String(movie_id))
        .eq("ui_language", ui_language)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (cached?.data) {
        // 캐시 히트: 즉시 완료 상태 job 생성
        const { data: job } = await supabase
          .from("sentiment_jobs")
          .insert({
            movie_id: String(movie_id),
            ui_language,
            status: "completed",
            stage: "cached",
            stage_message: "캐시된 분석 결과를 불러왔습니다.",
            progress: 100,
            result: cached.data,
          })
          .select("id")
          .single();

        return new Response(JSON.stringify({ job_id: job!.id }), { headers: CORS });
      }
    }

    // 새 Job 생성
    const { data: job, error: jobError } = await supabase
      .from("sentiment_jobs")
      .insert({
        movie_id: String(movie_id),
        ui_language,
        status: "pending",
        stage: "pending",
        stage_message: "분석을 시작합니다...",
        progress: 0,
      })
      .select("id")
      .single();

    if (jobError || !job) throw new Error("Failed to create job");

    return new Response(JSON.stringify({ job_id: job.id }), { headers: CORS });
  } catch (err) {
    return errResponse(err);
  }
});
