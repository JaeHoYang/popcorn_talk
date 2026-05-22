import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { CORS, optionsOk, errResponse } from "../_shared/utils.ts";

const JIKAN = "https://api.jikan.moe/v4";

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsOk();

  try {
    const body = await req.json().catch(() => ({}));
    const { query, genres, status, year_from, year_to, min_score, order_by } = body;

    const hasInput = query?.trim() || genres || status || year_from || year_to || min_score;
    if (!hasInput) {
      return new Response(JSON.stringify({ error: "query or filter required" }), { status: 400, headers: CORS });
    }

    const page = Math.max(1, Number(body.page) || 1);

    const url = new URL(`${JIKAN}/anime`);
    if (query?.trim()) url.searchParams.set("q", query.trim());
    url.searchParams.set("type", "tv");
    url.searchParams.set("sfw", "true");
    url.searchParams.set("limit", "24");
    url.searchParams.set("page", String(page));
    if (genres)    url.searchParams.set("genres", genres);
    if (status)    url.searchParams.set("status", status);
    if (year_from) url.searchParams.set("start_date", `${year_from}-01-01`);
    if (year_to)   url.searchParams.set("end_date",   `${year_to}-12-31`);
    if (min_score) url.searchParams.set("min_score",  String(min_score));
    if (order_by)  url.searchParams.set("order_by",   order_by);

    const res = await fetch(url.toString(), { headers: { "Accept-Encoding": "identity" } });
    if (!res.ok) throw new Error(`Jikan ${res.status}`);

    const data = await res.json();
    return new Response(JSON.stringify(data), { headers: CORS });
  } catch (err) {
    return errResponse(err);
  }
});
