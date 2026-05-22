import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { CORS, optionsOk, errResponse } from "../_shared/utils.ts";

async function hashPw(pw: string): Promise<string> {
  const data = new TextEncoder().encode(pw);
  const buf  = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsOk();

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const ADMIN = Deno.env.get("BOARD_ADMIN_SECRET") ?? "";

  try {
    const body   = await req.json();
    const action: string = body.action ?? "";

    // ── 글 작성 ──────────────────────────────────────────────
    if (action === "create-post") {
      const { category, title, content, author, password, isNotice, adminSecret } = body;
      if (!title?.trim() || !content?.trim() || !author?.trim() || !password)
        return new Response(JSON.stringify({ error: "필수 항목 누락" }), { status: 400, headers: CORS });

      if (isNotice && adminSecret !== ADMIN)
        return new Response(JSON.stringify({ error: "관리자 인증 실패" }), { status: 403, headers: CORS });

      const passwordHash = await hashPw(password);

      if (isNotice) {
        // 공지는 3개 게시판 모두에 저장
        const rows = (["movie", "anime", "webtoon"] as const).map(cat => ({
          category: cat, title: title.trim(), content: content.trim(),
          author: author.trim(), password_hash: passwordHash, is_notice: true,
        }));
        const { error } = await sb.from("board_posts").insert(rows);
        if (error) throw error;
        return new Response(JSON.stringify({ ok: true }), { headers: CORS });
      }

      const { data, error } = await sb.from("board_posts").insert({
        category, title: title.trim(), content: content.trim(),
        author: author.trim(), password_hash: passwordHash, is_notice: false,
      }).select("id").single();
      if (error) throw error;
      return new Response(JSON.stringify({ id: data.id }), { headers: CORS });
    }

    // ── 글 삭제 ──────────────────────────────────────────────
    if (action === "delete-post") {
      const { id, password, adminSecret } = body;
      if (ADMIN && adminSecret === ADMIN) {
        await sb.from("board_posts").delete().eq("id", id);
        return new Response(JSON.stringify({ ok: true }), { headers: CORS });
      }
      const { data: post } = await sb.from("board_posts").select("password_hash").eq("id", id).single();
      if (!post) return new Response(JSON.stringify({ error: "글 없음" }), { status: 404, headers: CORS });
      if (await hashPw(password) !== post.password_hash)
        return new Response(JSON.stringify({ error: "비밀번호 틀림" }), { status: 403, headers: CORS });
      await sb.from("board_posts").delete().eq("id", id);
      return new Response(JSON.stringify({ ok: true }), { headers: CORS });
    }

    // ── 댓글 작성 ────────────────────────────────────────────
    if (action === "create-comment") {
      const { postId, content, author, password } = body;
      if (!content?.trim() || !author?.trim() || !password)
        return new Response(JSON.stringify({ error: "필수 항목 누락" }), { status: 400, headers: CORS });

      await sb.from("board_comments").insert({
        post_id: postId, content: content.trim(),
        author: author.trim(), password_hash: await hashPw(password),
      });
      // comment_count +1
      const { data: p } = await sb.from("board_posts").select("comment_count").eq("id", postId).single();
      await sb.from("board_posts").update({ comment_count: (p?.comment_count ?? 0) + 1 }).eq("id", postId);
      return new Response(JSON.stringify({ ok: true }), { headers: CORS });
    }

    // ── 댓글 삭제 ────────────────────────────────────────────
    if (action === "delete-comment") {
      const { id, password, adminSecret } = body;
      const { data: comment } = await sb.from("board_comments").select("password_hash, post_id").eq("id", id).single();
      if (!comment) return new Response(JSON.stringify({ error: "댓글 없음" }), { status: 404, headers: CORS });

      if (!(ADMIN && adminSecret === ADMIN)) {
        if (await hashPw(password) !== comment.password_hash)
          return new Response(JSON.stringify({ error: "비밀번호 틀림" }), { status: 403, headers: CORS });
      }
      await sb.from("board_comments").delete().eq("id", id);
      const { data: p } = await sb.from("board_posts").select("comment_count").eq("id", comment.post_id).single();
      await sb.from("board_posts").update({ comment_count: Math.max(0, (p?.comment_count ?? 1) - 1) }).eq("id", comment.post_id);
      return new Response(JSON.stringify({ ok: true }), { headers: CORS });
    }

    // ── 조회수 증가 ──────────────────────────────────────────
    if (action === "increment-view") {
      const { id } = body;
      const { data: p } = await sb.from("board_posts").select("view_count").eq("id", id).single();
      await sb.from("board_posts").update({ view_count: (p?.view_count ?? 0) + 1 }).eq("id", id);
      return new Response(JSON.stringify({ ok: true }), { headers: CORS });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: CORS });
  } catch (err) {
    return errResponse(err);
  }
});
