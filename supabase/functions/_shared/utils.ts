export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json; charset=utf-8",
};

export const optionsOk = () => new Response("ok", { headers: CORS });

export function errResponse(err: unknown, status = 500): Response {
  const message = err instanceof Error ? err.message : "Unknown error";
  return new Response(JSON.stringify({ error: message }), { status, headers: CORS });
}
