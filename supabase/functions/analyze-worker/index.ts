import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CORS, optionsOk } from "../_shared/utils.ts";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// ── Job 상태 업데이트 ──────────────────────────────────────────────────────
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

const AI_PROVIDERS: Array<{ name: string; model: string; fn: (p: string) => Promise<string> }> = [
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

// ── JSON 안전 파싱 ────────────────────────────────────────────────────────
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
      console.error("[safeParseJSON] failed:", candidate.slice(0, 300));
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

// ── 네이버 블로그 리뷰 수집 ───────────────────────────────────────────────
async function fetchNaverBlogReviews(title: string, clientId: string, clientSecret: string): Promise<string[]> {
  const url = new URL("https://openapi.naver.com/v1/search/blog.json");
  url.searchParams.set("query", `${title} 영화 리뷰`);
  url.searchParams.set("display", "15");
  url.searchParams.set("sort", "sim");

  const res = await fetch(url.toString(), {
    headers: { "X-Naver-Client-Id": clientId, "X-Naver-Client-Secret": clientSecret },
  });
  if (!res.ok) return [];

  const data = await res.json();
  return ((data.items ?? []) as Array<{ description: string }>)
    .map((item) =>
      item.description
        .replace(/<[^>]*>/g, "")
        .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
        .trim()
        .slice(0, 100)
    )
    .filter((s) => s.length > 10);
}

async function fetchNaverMovieRating(title: string, clientId: string, clientSecret: string): Promise<string | null> {
  const url = new URL("https://openapi.naver.com/v1/search/movie.json");
  url.searchParams.set("query", title);
  url.searchParams.set("display", "5");

  const res = await fetch(url.toString(), {
    headers: { "X-Naver-Client-Id": clientId, "X-Naver-Client-Secret": clientSecret },
  });
  if (!res.ok) return null;

  const data = await res.json();
  const movie = (data.items as Array<{ title: string; userRating: string }> | undefined)?.[0];
  if (!movie?.userRating || movie.userRating === "0.00") return null;

  const cleanTitle = movie.title.replace(/<[^>]*>/g, "");
  const rating = parseFloat(movie.userRating);
  const sentiment = rating >= 8 ? "매우 긍정적" : rating >= 6 ? "긍정적" : rating >= 4 ? "혼합" : "부정적";
  return `네이버 관람객 평점 ${movie.userRating}/10 (${sentiment}). 영화: ${cleanTitle}`;
}

// ── 메인 분석 로직 ─────────────────────────────────────────────────────────
async function runAnalysis(supabase: SupabaseClient, jobId: string, movieId: string, title: string, uiLanguage: string) {
  const ytKey       = Deno.env.get("YOUTUBE_API_KEY");
  const naverId     = Deno.env.get("NAVER_CLIENT_ID");
  const naverSecret = Deno.env.get("NAVER_CLIENT_SECRET");

  try {
    await updateJob(supabase, jobId, {
      status: "processing",
      stage: "searching_videos",
      stage_message: "YouTube 영상 검색 중...",
      progress: 10,
    });

    const [ytComments, naverReviews, naverRating] = await Promise.all([
      ytKey
        ? searchYouTubeVideos(`${title} 리뷰 영화`, ytKey)
            .then((videos) => Promise.all(videos.slice(0, 3).map((v) => fetchComments(v.videoId, ytKey!))))
            .then((batches) => batches.flat())
            .catch(() => [] as string[])
        : Promise.resolve([] as string[]),
      naverId && naverSecret
        ? fetchNaverBlogReviews(title, naverId, naverSecret).catch(() => [] as string[])
        : Promise.resolve([] as string[]),
      naverId && naverSecret
        ? fetchNaverMovieRating(title, naverId, naverSecret).catch(() => null)
        : Promise.resolve(null),
    ]);

    await updateJob(supabase, jobId, {
      stage: "collecting_data",
      stage_message: `데이터 수집 완료 (YouTube ${ytComments.length}개, 네이버 ${naverReviews.length}개)`,
      progress: 40,
    });

    const allTexts = [...ytComments, ...naverReviews];
    if (naverRating) allTexts.push(naverRating);

    // 데이터 부족 시 최소 컨텍스트 보장
    const hasMinData = allTexts.length >= 3;
    if (!hasMinData) {
      allTexts.push(`${title} 영화에 대한 분석`);
    }

    const uniqueComments = [...new Set(allTexts.filter(t => t.trim().length > 5))].slice(0, 20);
    const naverCount = naverReviews.length;

    await updateJob(supabase, jobId, {
      stage: "analyzing_sentiment",
      stage_message: "AI 리뷰 분석 중...",
      progress: 60,
    });

    const hasKorean = naverCount > 0 || ytComments.some((c) => /[가-힣]/.test(c));
    const outputLang = uiLanguage.startsWith("ko") ? "Korean" : uiLanguage.startsWith("en") ? "English" : uiLanguage;
    const koreanHint = hasKorean ? `
Korean language notes:
- "ㅋㅋ"/"ㅎㅎ" = laughter/positive, "ㅠㅠ"/"ㅜㅜ" = sadness/disappointment
- "대박" = amazing, "역대급" = best ever, "최고" = the best, "감동" = touching
- "별로" = not great, "지루하다" = boring, "실망" = disappointing, "억지" = forced
- Consider sarcasm: "이게 영화야?" = negative` : "";

    const dataNote = !hasMinData ? "\nNote: Limited review data available. Base analysis on what's provided." : "";

    const prompt = `You are a movie review analyst specializing in Korean audience reviews. Analyze the following reviews about the movie "${title}".
${koreanHint}${dataNote}
REVIEWS (${uniqueComments.length} total, sources: YouTube comments + Naver blog reviews):
${uniqueComments.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Return ONLY a valid JSON object with this exact structure:
{
  "sentiment_score": <integer 0-100>,
  "positive_keywords": ["word1", "word2", "word3", "word4", "word5"],
  "negative_keywords": ["word1", "word2", "word3"],
  "summary": "<one factual sentence about overall audience sentiment>",
  "viewing_point": "<2-3 sentences about why audiences enjoyed this movie>",
  "downside": "<2-3 sentences about shortcomings, or empty string if overwhelmingly positive>"
}

Rules:
- sentiment_score: 0=extremely negative, 50=neutral/mixed, 100=extremely positive
- positive_keywords: up to 5 praised aspects (in ${outputLang})
- negative_keywords: up to 3 criticized aspects (in ${outputLang}, empty array if none)
- summary: one sentence in ${outputLang}
- viewing_point: 2-3 sentences in ${outputLang}
- downside: 2-3 sentences in ${outputLang}, or empty string
- Respond ONLY with the JSON object`;

    // AI 호출 — 파싱 실패 시 1회 재시도
    let finalResult: Record<string, unknown> | null = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      const raw = await callAIWithFallback(supabase, prompt);
      finalResult = safeParseJSON(raw);
      if (finalResult && validateResult(finalResult)) break;
      console.error(`AI parse attempt ${attempt + 1} failed`);
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
      youtube_samples: ytComments.filter(c => c.trim().length > 10).slice(0, 5),
      naver_samples: naverReviews.filter(c => c.trim().length > 10).slice(0, 3),
      analyzed_at: new Date().toISOString(),
      data_sources: { youtube_comments: ytComments.length, naver_reviews: naverCount },
    };

    await supabase.from("sentiment_cache").upsert(
      { movie_id: movieId, ui_language: uiLanguage, data: result, expires_at: new Date(Date.now() + CACHE_TTL_MS).toISOString() },
      { onConflict: "movie_id,ui_language" }
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
    console.error("analyze-worker error:", message);
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

// ── Edge Function 엔트리포인트 ─────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") return optionsOk();

  const body = await req.json().catch(() => ({}));
  const { job_id, movie_id, title, ui_language = "ko-KR" } = body;

  if (!job_id || !movie_id || !title) {
    return new Response(JSON.stringify({ error: "job_id, movie_id, title required" }), {
      status: 400,
      headers: CORS,
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const runPromise = runAnalysis(supabase, job_id, movie_id, title, ui_language);

  if (typeof (globalThis as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } }).EdgeRuntime?.waitUntil === "function") {
    (globalThis as { EdgeRuntime: { waitUntil: (p: Promise<unknown>) => void } }).EdgeRuntime.waitUntil(runPromise);
  }

  return new Response(JSON.stringify({ accepted: true }), { status: 202, headers: CORS });
});
