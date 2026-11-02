// 리뷰 저장 창구 (Cloudflare Pages Functions)
// - POST /api/review : 게임 엔딩의 리뷰를 KV 저장소(REVIEWS)에 저장
// - GET  /api/review?key=비밀번호 : 저장된 리뷰 목록 (ADMIN_KEY와 같아야 함)
// 필요한 설정(Cloudflare 대시보드): KV 바인딩 이름 REVIEWS, 비밀 변수 ADMIN_KEY

const QUESTIONS = ['q1', 'q2', 'q3', 'q4'];
const clip = (v, n) => String(v ?? '').slice(0, n);

export async function onRequestPost({ request, env }) {
  if (!env.REVIEWS) return new Response('review store not configured', { status: 503 });
  const len = Number(request.headers.get('content-length') || 0);
  if (len > 4000) return new Response('too large', { status: 413 });
  let body;
  try { body = await request.json(); } catch { return new Response('bad json', { status: 400 }); }
  if (!body || typeof body !== 'object') return new Response('bad body', { status: 400 });
  const rec = { t: Date.now(), v: clip(body.v, 20), info: clip(body.info, 200), a: {} };
  for (const q of QUESTIONS) rec.a[q] = clip(body.a?.[q], 40);
  const id = `r:${rec.t}:${crypto.randomUUID().slice(0, 8)}`;
  await env.REVIEWS.put(id, JSON.stringify(rec));
  return Response.json({ ok: true });
}

export async function onRequestGet({ request, env }) {
  const key = new URL(request.url).searchParams.get('key');
  if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) return new Response('forbidden', { status: 403 });
  if (!env.REVIEWS) return new Response('review store not configured', { status: 503 });
  const out = [];
  let cursor;
  do {
    const page = await env.REVIEWS.list({ prefix: 'r:', cursor });
    for (const k of page.keys) { const v = await env.REVIEWS.get(k.name); if (v) out.push(JSON.parse(v)); }
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor && out.length < 3000);
  out.sort((a, b) => b.t - a.t);
  return Response.json(out, { headers: { 'cache-control': 'no-store' } });
}
