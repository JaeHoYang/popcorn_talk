import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { CORS, optionsOk, errResponse } from "../_shared/utils.ts";

const TMDB_BASE = "https://api.themoviedb.org/3";
const NO_GZIP = { headers: { "Accept-Encoding": "identity" } };

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsOk();

  try {
    const { query, language = "ko-KR" } = await req.json();
    if (!query?.trim())
      return new Response(JSON.stringify({ error: "query is required" }), { status: 400, headers: CORS });

    const apiKey = Deno.env.get("TMDB_API_KEY")!;
    const url = new URL(`${TMDB_BASE}/search/tv`);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("query", query.trim());
    url.searchParams.set("language", language);
    url.searchParams.set("include_adult", "false");

    const res = await fetch(url.toString(), NO_GZIP);
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    const data = await res.json();
    return new Response(JSON.stringify(data), { headers: CORS });
  } catch (err) {
    return errResponse(err);
  }
});
