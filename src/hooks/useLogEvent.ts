import { supabase } from "@/lib/supabase";

export function useLogEvent() {
  function logPage(path: string) {
    supabase.functions.invoke("log-event", { body: { type: "page", path } }).catch(() => {});
  }

  function logMovie(movie_id: number | string, movie_title: string, poster_path?: string | null) {
    supabase.functions.invoke("log-event", {
      body: { type: "movie", movie_id: String(movie_id), movie_title, poster_path: poster_path ?? null },
    }).catch(() => {});
  }

  function logAnime(mal_id: number, title: string, image_url?: string | null) {
    supabase.functions.invoke("log-event", {
      body: { type: "anime", movie_id: String(mal_id), movie_title: title, poster_path: image_url ?? null },
    }).catch(() => {});
  }

  function logWebtoon(id: string, title: string, cover_url?: string | null) {
    supabase.functions.invoke("log-event", {
      body: { type: "webtoon", movie_id: id, movie_title: title, poster_path: cover_url ?? null },
    }).catch(() => {});
  }

  function logDrama(id: number | string, title: string, poster_path?: string | null) {
    supabase.functions.invoke("log-event", {
      body: { type: "drama", movie_id: String(id), movie_title: title, poster_path: poster_path ?? null },
    }).catch(() => {});
  }

  return { logPage, logMovie, logAnime, logWebtoon, logDrama };
}
