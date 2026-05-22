import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CORS, optionsOk, errResponse } from "../_shared/utils.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsOk();

  try {
    const { job_id } = await req.json();
    if (!job_id) {
      return new Response(JSON.stringify({ error: "job_id is required" }), { status: 400, headers: CORS });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: job, error } = await supabase
      .from("sentiment_jobs")
      .select("id, status, stage, stage_message, progress, result, error_message")
      .eq("id", job_id)
      .single();

    if (error || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), { status: 404, headers: CORS });
    }

    return new Response(JSON.stringify(job), { headers: CORS });
  } catch (err) {
    return errResponse(err);
  }
});
