import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CORS, optionsOk } from "../_shared/utils.ts";

const JIKAN = "https://api.jikan.moe/v4";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function updateJob(
  supabase: SupabaseClient,
  jobId: string,
  fields: { status?: string; stage?: string; stage_message?: string; progress?: number; result?: unknown; error_message?: string }
) {
  await supabase.from("sentiment_jobs").update(fields).eq("id", jobId);
}

// ── AI Provider 호출 ───────────────────────────────────────────────────────
async function callGemini(prompt: string): Promise<string> {
  const key = Deno.env.get("GEMINI_API_KEY")!;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 8192, temperature: 0.2, responseMimeType: "application/json" },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned empty response");
  return text as string;
}

async function callGroq(prompt: string): Promise<string> {
  const key = Deno.env.get("GROQ_API_KEY")!;
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are a JSON-only response bot. Always respond with valid JSON, no markdown." },
        { role: "user", content: prompt },
      ],
      max_tokens: 4096,
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content as string;
}

async function callCerebras(prompt: string): Promise<string> {
  const key = Deno.env.get("CEREBRAS_API_KEY")!;
  const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama3.1-8b",
      messages: [
        { role: "system", content: "You are a JSON-only response bot. Always respond with valid JSON, no markdown." },
        { role: "user", content: prompt },
      ],
      max_tokens: 4096,
      temperature: 0.2,
    }),
  });
  if (!res.ok) throw new Error(`Cerebras ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content as string;
}

const AI_PROVIDERS = [
  { name: "gemini",   model: "gemini-2.5-flash",     fn: callGemini   },
  { name: "groq",     model: "llama-3.1-8b-instant", fn: callGroq     },
  { name: "cerebras", model: "llama3.1-8b",           fn: callCerebras },
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callAIWithFallback(supabase: SupabaseClient, prompt: string): Promise<string> {
  for (const provider of AI_PROVIDERS) {
    const envKey = provider.name.toUpperCase() + "_API_KEY";
    if (!Deno.env.get(envKey)) continue;

    let lastErr: Error | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const start = Date.now();
      try {
        const result = await provider.fn(prompt);
        await supabase.from("ai_usage_events").insert({
          provider: provider.name,
          model: provider.model,
          duration_ms: Date.now() - start,
          status: "success",
          prompt_chars: prompt.length,
          response_chars: result.length,
          retry_count: attempt,
        });
        return result;
      } catch (err) {
        lastErr = err instanceof Error ? err : new Error(String(err));
        const isRetryable = lastErr.message.includes("429") || lastErr.message.includes("503");
        await supabase.from("ai_usage_events").insert({
          provider: provider.name,
          model: provider.model,
          duration_ms: Date.now() - start,
          status: "error",
          error_message: lastErr.message,
          prompt_chars: prompt.length,
          retry_count: attempt,
        });
        if (!isRetryable || lastErr.message.includes("429")) break;
        await sleep(Math.pow(2, attempt) * 1000);
      }
    }
    console.error(`${provider.name} failed: ${lastErr?.message}`);
  }
  throw new Error("All AI providers failed");
}

function safeParseJSON(text: string): Record<string, unknown> | null {
  if (!text) return null;
  const stripped = text.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1").trim();
  const candidate = stripped.match(/\{[\s\S]*\}/)?.[0] ?? stripped;
  try {
    return JSON.parse(candidate);
  } catch {
    const fixed = candidate.replace(/,\s*([}\]])/g, "$1");
    try {
      return JSON.parse(fixed);
    } catch {
      return null;
    }
  }
}

function validateResult(r: Record<string, unknown>): boolean {
  return (
    typeof r.sentiment_score === "number" &&
    Array.isArray(r.positive_keywords) &&
    typeof r.summary === "string"
  );
}

// ── YouTube 검색 + 댓글 수집 ──────────────────────────────────────────────
interface YTVideo { videoId: string; title: string }

async function searchYouTubeVideos(query: string, apiKey: string): Promise<YTVideo[]> {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "5");
  url.searchParams.set("relevanceLanguage", "ko");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube search ${res.status}`);
  const data = await res.json();
  return (data.items ?? []).map((item: { id: { videoId: string }; snippet: { title: string } }) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
  }));
}

async function fetchComments(videoId: string, apiKey: string): Promise<string[]> {
  const url = new URL("https://www.googleapis.com/youtube/v3/commentThreads");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("videoId", videoId);
  url.searchParams.set("maxResults", "20");
  url.searchParams.set("order", "relevance");
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) return [];
  const data = await res.json();
  return (data.items ?? []).map(
    (item: { snippet: { topLevelComment: { snippet: { textDisplay: string } } } }) =>
      item.snippet.topLevelComment.snippet.textDisplay.slice(0, 100)
  );
}

// ── Jikan 유저 리뷰 수집 ────────────────────────────────────────────────
async function fetchJikanReviews(malId: number): Promise<string[]> {
  const res = await fetch(`${JIKAN}/anime/${malId}/reviews?preliminary=false`, {
    headers: { "Accept-Encoding": "identity" },
  });
  if (!res.ok) return [];

  const data = await res.json();
  return ((data.data ?? []) as Array<{ review: string; score: number }>)
    .slice(0, 10)
    .map((r) => r.review.slice(0, 150).replace(/\n+/g, " ").trim())
    .filter((s) => s.length > 20);
}

// ── 메인 분석 로직 ─────────────────────────────────────────────────────────
async function runAnalysis(
  supabase: SupabaseClient,
  jobId: string,
  malId: number,
  title: string,
  uiLanguage: string
) {
  const ytKey = Deno.env.get("YOUTUBE_API_KEY");

  try {
    await updateJob(supabase, jobId, {
      status: "processing",
      stage: "searching_videos",
      stage_message: "YouTube 리뷰 및 MAL 유저 리뷰 검색 중...",
      progress: 10,
    });

    const [ytComments, jikanReviews] = await Promise.all([
      ytKey
        ? searchYouTubeVideos(`${title} 애니 리뷰`, ytKey)
            .then((videos) => Promise.all(videos.slice(0, 3).map((v) => fetchComments(v.videoId, ytKey!))))
            .then((batches) => batches.flat())
            .catch(() => [] as string[])
        : Promise.resolve([] as string[]),
      fetchJikanReviews(malId).catch(() => [] as string[]),
    ]);

    await updateJob(supabase, jobId, {
      stage: "collecting_data",
      stage_message: `데이터 수집 완료 (YouTube ${ytComments.length}개, MAL 리뷰 ${jikanReviews.length}개)`,
      progress: 40,
    });

    const allTexts = [...ytComments, ...jikanReviews];

    if (allTexts.length < 3) {
      allTexts.push(`${title} 애니메이션에 대한 분석`);
    }

    const uniqueComments = [...new Set(allTexts.filter((t) => t.trim().length > 5))].slice(0, 20);

    await updateJob(supabase, jobId, {
      stage: "analyzing_sentiment",
      stage_message: "AI 리뷰 분석 중...",
      progress: 60,
    });

    const hasKorean = ytComments.some((c) => /[가-힣]/.test(c));
    const outputLang = uiLanguage.startsWith("ko") ? "Korean" : "English";
    const koreanHint = hasKorean
      ? `\nKorean anime slang notes:
- "작화" = animation quality/art style, "개연성" = plot coherence, "떡밥" = plot hooks/foreshadowing
- "ㅋㅋ"/"ㅎㅎ" = laughter/positive, "ㅠㅠ"/"ㅜㅜ" = emotional/moving
- "레전드" = legendary/masterpiece, "명작" = classic, "역대급" = best ever
- "용두사미" = strong start weak ending, "주인공 버프" = protagonist is too overpowered
- "감동" = moving/emotional, "힐링" = healing/soothing, "중2병" = edgy/chunibyo style`
      : "";

    const prompt = `You are an anime review analyst. Analyze the following reviews about the anime "${title}".
${koreanHint}
REVIEWS (${uniqueComments.length} total, sources: YouTube comments + MyAnimeList user reviews):
${uniqueComments.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Return ONLY a valid JSON object with this exact structure:
{
  "sentiment_score": <integer 0-100>,
  "positive_keywords": ["word1", "word2", "word3", "word4", "word5"],
  "negative_keywords": ["word1", "word2", "word3"],
  "summary": "<one factual sentence about overall audience sentiment>",
  "viewing_point": "<2-3 sentences about why audiences enjoyed this anime>",
  "downside": "<2-3 sentences about shortcomings, or empty string if overwhelmingly positive>"
}

Rules:
- sentiment_score: 0=extremely negative, 50=neutral/mixed, 100=extremely positive
- positive_keywords: up to 5 praised aspects like animation, story, characters, music, emotion (in ${outputLang})
- negative_keywords: up to 3 criticized aspects (in ${outputLang}, empty array if none)
- summary: one sentence in ${outputLang}
- viewing_point: 2-3 sentences in ${outputLang}
- downside: 2-3 sentences in ${outputLang}, or empty string
- Respond ONLY with the JSON object`;

    let finalResult: Record<string, unknown> | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const raw = await callAIWithFallback(supabase, prompt);
      finalResult = safeParseJSON(raw);
      if (finalResult && validateResult(finalResult)) break;
    }

    if (!finalResult || !validateResult(finalResult)) {
      throw new Error("AI returned invalid JSON after retries");
    }

    await updateJob(supabase, jobId, { stage_message: "요약 작성 중...", progress: 90 });

    const result = {
      sentiment_score: Math.max(0, Math.min(100, Math.round(Number(finalResult.sentiment_score)))),
      positive_keywords: (finalResult.positive_keywords as string[]) ?? [],
      negative_keywords: (finalResult.negative_keywords as string[]) ?? [],
      summary: String(finalResult.summary ?? ""),
      viewing_point: String(finalResult.viewing_point ?? ""),
      downside: String(finalResult.downside ?? ""),
      youtube_samples: ytComments.filter((c) => c.trim().length > 10).slice(0, 5),
      naver_samples: jikanReviews.filter((c) => c.trim().length > 10).slice(0, 3),
      analyzed_at: new Date().toISOString(),
      data_sources: { youtube_comments: ytComments.length, naver_reviews: jikanReviews.length },
    };

    await supabase.from("anime_sentiment_cache").upsert(
      { mal_id: malId, ui_language: uiLanguage, data: result, expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString() },
      { onConflict: "mal_id,ui_language" }
    );

    await updateJob(supabase, jobId, {
      status: "completed",
      stage: "completed",
      stage_message: "분석 완료!",
      progress: 100,
      result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("analyze-anime-worker error:", message);
    const isRateLimit = message.includes("429");
    await updateJob(supabase, jobId, {
      status: "failed",
      stage: "failed",
      stage_message: isRateLimit
        ? "AI 요청이 일시적으로 제한되었습니다. 1분 후 재시도해 주세요."
        : "분석 중 오류가 발생했습니다.",
      error_message: message,
    });
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsOk();

  const body = await req.json().catch(() => ({}));
  const { job_id, mal_id, title, ui_language = "ko-KR" } = body;

  if (!job_id || !mal_id || !title) {
    return new Response(JSON.stringify({ error: "job_id, mal_id, title required" }), {
      status: 400,
      headers: CORS,
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 백그라운드 실행 후 즉시 202 반환
  const runPromise = runAnalysis(supabase, job_id, Number(mal_id), title, ui_language);
  // @ts-ignore Deno EdgeRuntime
  if (typeof EdgeRuntime !== "undefined") {
    EdgeRuntime.waitUntil(runPromise);
  } else {
    runPromise.catch(console.error);
  }

  return new Response(JSON.stringify({ started: true }), { status: 202, headers: CORS });
});
