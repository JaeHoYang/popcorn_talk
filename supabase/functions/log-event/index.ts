import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CORS, optionsOk } from "../_shared/utils.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsOk();

  try {
    const body = await req.json().catch(() => ({}));
    const { type, path, movie_id, movie_title, poster_path } = body;

    const ip =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      null;
    const user_agent = req.headers.get("user-agent") ?? null;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (type === "page" && path) {
      await supabase.from("page_views").insert({ path, ip, user_agent });
    } else if (type === "movie" && movie_id && movie_title) {
      await supabase.from("movie_views").insert({ movie_id: String(movie_id), movie_title, poster_path: poster_path ?? null });
    } else if (type === "anime" && movie_id && movie_title) {
      await supabase.from("anime_views").insert({ mal_id: Number(movie_id), title: movie_title });
    } else if (type === "webtoon" && movie_id && movie_title) {
      await supabase.from("webtoon_views").insert({ webtoon_id: String(movie_id), title: movie_title });
    } else if (type === "drama" && movie_id && movie_title) {
      await supabase.from("drama_views").insert({ drama_id: String(movie_id), title: movie_title, poster_path: poster_path ?? null });
    }

    return new Response(null, { status: 204, headers: CORS });
  } catch {
    return new Response(null, { status: 204, headers: CORS });
  }
});
