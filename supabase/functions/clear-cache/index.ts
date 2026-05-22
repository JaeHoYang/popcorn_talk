import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CORS, optionsOk } from "../_shared/utils.ts";

type TableEntry = { table: string; filterCol: string };

const TARGET_TABLES: Record<string, TableEntry[]> = {
  popular:   [{ table: "popular_movies_cache",  filterCol: "created_at" }],
  movie:     [{ table: "movie_cache",           filterCol: "created_at" }],
  person:    [{ table: "person_cache",          filterCol: "created_at" }],
  boxoffice: [{ table: "boxoffice_cache",       filterCol: "created_at" }],
  sentiment: [{ table: "sentiment_cache",       filterCol: "created_at" }],
  anime:     [
    { table: "anime_cache",           filterCol: "expires_at" },
    { table: "popular_anime_cache",   filterCol: "expires_at" },
    { table: "anime_sentiment_cache", filterCol: "expires_at" },
  ],
  drama:     [
    { table: "drama_sentiment_cache", filterCol: "expires_at" },
  ],
  all: [
    { table: "popular_movies_cache",  filterCol: "created_at" },
    { table: "movie_cache",           filterCol: "created_at" },
    { table: "person_cache",          filterCol: "created_at" },
    { table: "boxoffice_cache",       filterCol: "created_at" },
    { table: "sentiment_cache",       filterCol: "created_at" },
    { table: "anime_cache",           filterCol: "expires_at" },
    { table: "popular_anime_cache",   filterCol: "expires_at" },
    { table: "anime_sentiment_cache", filterCol: "expires_at" },
    { table: "drama_sentiment_cache", filterCol: "expires_at" },
  ],
};

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsOk();

  // 인증 확인 — 로그인 사용자만 허용
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });
  }

  const anonClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: { user } } = await anonClient.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: CORS });
  }

  const body = await req.json().catch(() => ({}));
  const target: string = body.target ?? "all";
  const tables = TARGET_TABLES[target];

  if (!tables) {
    return new Response(JSON.stringify({ error: `Unknown target: ${target}` }), {
      status: 400,
      headers: CORS,
    });
  }

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const results: Record<string, { deleted: number; error?: string }> = {};

  for (const { table, filterCol } of tables) {
    const { data, error } = await serviceClient
      .from(table)
      .delete()
      .gte(filterCol, "1900-01-01")
      .select();

    if (error) {
      results[table] = { deleted: 0, error: error.message };
    } else {
      results[table] = { deleted: data?.length ?? 0 };
    }
  }

  return new Response(JSON.stringify({ results }), { headers: CORS });
});
