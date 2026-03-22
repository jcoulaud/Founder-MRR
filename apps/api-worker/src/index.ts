import {
  type FounderEntry,
  type LeaderboardData,
  KV_KEYS,
  formatRevenueExact,
  formatGrowth,
  escapeHtml,
  isValidHandle,
} from "@foundermrr/shared";
import { Resvg, initWasm } from "@resvg/resvg-wasm";
// @ts-expect-error — wrangler bundles .wasm imports
import resvgWasm from "@resvg/resvg-wasm/index_bg.wasm";

interface Env {
  KV: KVNamespace;
}

const CRAWLER_UA_PATTERNS = [
  "Twitterbot", "facebookexternalhit", "LinkedInBot", "Googlebot",
  "Slackbot", "WhatsApp", "TelegramBot", "Discordbot",
];

const OG_CACHE_TTL_FOUND = 21600; // 6 hours
const OG_CACHE_TTL_FALLBACK = 3600; // 1 hour
const API_CACHE_MAX_AGE = 300; // 5 minutes
const STALE_THRESHOLD_MS = 12 * 3600_000; // 12 hours

function isCrawler(ua: string | null): boolean {
  if (!ua) return false;
  return CRAWLER_UA_PATTERNS.some((p) => ua.includes(p));
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "https://foundermrr.com",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function jsonResponse(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(), ...extraHeaders },
  });
}

async function getLeaderboard(env: Env): Promise<LeaderboardData | null> {
  const raw = await env.KV.get(KV_KEYS.LEADERBOARD, { cacheTtl: API_CACHE_MAX_AGE });
  if (!raw) return null;
  try {
    return JSON.parse(raw) as LeaderboardData;
  } catch {
    return null;
  }
}

async function findFounder(handle: string, env: Env): Promise<FounderEntry | null> {
  const data = await getLeaderboard(env);
  if (!data) return null;
  return data.data.find((f) => f.xHandle === handle) || null;
}

async function handleLeaderboard(env: Env): Promise<Response> {
  const raw = await env.KV.get(KV_KEYS.LEADERBOARD, { cacheTtl: API_CACHE_MAX_AGE });
  if (!raw) return jsonResponse({ error: "sync_pending" }, 503);
  return new Response(raw, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${API_CACHE_MAX_AGE}`,
      ...corsHeaders(),
    },
  });
}

async function handleFounder(handle: string, env: Env): Promise<Response> {
  const entry = await findFounder(handle, env);
  if (!entry) return jsonResponse({ error: "not_found" }, 404);
  return jsonResponse(entry, 200, { "Cache-Control": `public, max-age=${API_CACHE_MAX_AGE}` });
}

function parseSyncError(raw: string | null): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return { error: "parse_error", raw };
  }
}

async function handleHealth(env: Env): Promise<Response> {
  const data = await getLeaderboard(env);
  const syncErrorRaw = await env.KV.get(KV_KEYS.SYNC_ERROR);
  const syncError = parseSyncError(syncErrorRaw);

  if (!data) {
    return jsonResponse({
      status: syncError ? "error" : "pending",
      lastSyncedAt: null,
      totalFounders: 0,
      totalStartups: 0,
      syncError,
    });
  }

  const syncAge = Date.now() - new Date(data.lastSyncedAt).getTime();
  return jsonResponse({
    status: syncAge > STALE_THRESHOLD_MS ? "stale" : "healthy",
    lastSyncedAt: data.lastSyncedAt,
    totalFounders: data.totalFounders,
    totalStartups: data.totalStartups,
    syncAgeMinutes: Math.round(syncAge / 60000),
    syncError,
  });
}

function buildCrawlerHtml(entry: FounderEntry): string {
  const rev = formatRevenueExact(entry.totalRevenue30d);
  const growth = formatGrowth(entry.avgGrowth30d);
  const title = `@${entry.xHandle} — Ranked #${entry.rank} on FounderMRR`;
  const description = `${rev}/mo total revenue across ${entry.startupCount} startup${entry.startupCount > 1 ? "s" : ""}${growth ? ` | ${growth} growth` : ""}`;
  const safeHandle = encodeURIComponent(entry.xHandle);
  const ogImageUrl = `https://foundermrr.com/og/${safeHandle}`;
  const pageUrl = `https://foundermrr.com/founder/${safeHandle}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${escapeHtml(ogImageUrl)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${escapeHtml(pageUrl)}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(ogImageUrl)}">
<meta http-equiv="refresh" content="0;url=${escapeHtml(pageUrl)}">
</head>
<body><p>Redirecting...</p></body>
</html>`;
}

function generateOgSvg(entry: FounderEntry): string {
  const rev = formatRevenueExact(entry.totalRevenue30d);
  const mrr = formatRevenueExact(entry.totalMrr);
  const growth = formatGrowth(entry.avgGrowth30d);
  const handle = escapeHtml(`@${entry.xHandle}`);
  const rank = entry.rank;
  const startupNames = entry.startups.slice(0, 3).map((s) => escapeHtml(s.name)).join(", ");
  const more = entry.startupCount > 3 ? ` +${entry.startupCount - 3} more` : "";
  const growthColor = entry.avgGrowth30d !== null && entry.avgGrowth30d > 0 ? "#059669" : "#DC2626";

  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#ffffff"/>
  <rect x="0" y="0" width="1200" height="4" fill="#059669"/>

  <!-- Rank badge -->
  <rect x="60" y="50" width="100" height="50" rx="10" fill="#FFFBEB" stroke="#FEF3C7" stroke-width="1"/>
  <text x="110" y="84" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="28" fill="#B45309">#${rank}</text>

  <!-- Brand -->
  <text x="1140" y="82" text-anchor="end" font-family="sans-serif" font-weight="700" font-size="16" fill="#94A3B8" letter-spacing="2">FOUNDERMRR</text>

  <!-- Handle -->
  <text x="60" y="200" font-family="sans-serif" font-weight="700" font-size="52" fill="#0F172A">${handle}</text>

  <!-- Startups -->
  <text x="60" y="245" font-family="sans-serif" font-weight="400" font-size="20" fill="#94A3B8">${entry.startupCount} startup${entry.startupCount > 1 ? "s" : ""}: ${startupNames}${more}</text>

  <!-- Divider -->
  <rect x="60" y="290" width="1080" height="1" fill="#E2E8F0"/>

  <!-- Revenue -->
  <text x="60" y="360" font-family="sans-serif" font-weight="500" font-size="14" fill="#94A3B8" letter-spacing="1.5">REVENUE (30D)</text>
  <text x="60" y="420" font-family="sans-serif" font-weight="700" font-size="56" fill="#0F172A">${rev}/mo</text>

  <!-- MRR -->
  <text x="500" y="360" font-family="sans-serif" font-weight="500" font-size="14" fill="#94A3B8" letter-spacing="1.5">MRR</text>
  <text x="500" y="420" font-family="sans-serif" font-weight="700" font-size="56" fill="#0F172A">${mrr}</text>

  <!-- Growth -->
  ${growth ? `
  <text x="850" y="360" font-family="sans-serif" font-weight="500" font-size="14" fill="#94A3B8" letter-spacing="1.5">GROWTH</text>
  <text x="850" y="420" font-family="sans-serif" font-weight="700" font-size="56" fill="${growthColor}">${growth}</text>
  ` : ""}

  <!-- Footer -->
  <rect x="0" y="530" width="1200" height="100" fill="#F8FAFC"/>
  <text x="60" y="575" font-family="sans-serif" font-weight="500" font-size="16" fill="#94A3B8">foundermrr.com — Verified founder revenue, ranked</text>
</svg>`;
}

function generateFallbackSvg(): string {
  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#ffffff"/>
  <rect x="0" y="0" width="1200" height="4" fill="#059669"/>
  <text x="600" y="280" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="48" fill="#0F172A">FounderMRR</text>
  <text x="600" y="340" text-anchor="middle" font-family="sans-serif" font-weight="400" font-size="24" fill="#94A3B8">Verified founder revenue, ranked</text>
</svg>`;
}

let resvgInitialized = false;

async function svgToPng(svg: string): Promise<Uint8Array> {
  if (!resvgInitialized) {
    await initWasm(resvgWasm);
    resvgInitialized = true;
  }
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
    font: { defaultFontFamily: "sans-serif" },
  });
  const rendered = resvg.render();
  return rendered.asPng();
}

async function handleOgImage(handle: string, env: Env, request: Request): Promise<Response> {
  const cacheKey = new Request(request.url, request);
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const entry = await findFounder(handle, env);
  const svg = entry ? generateOgSvg(entry) : generateFallbackSvg();

  let body: Uint8Array | string;
  let contentType: string;

  try {
    body = await svgToPng(svg);
    contentType = "image/png";
  } catch {
    // Fallback to SVG if PNG conversion fails
    body = svg;
    contentType = "image/svg+xml";
  }

  const response = new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": `public, max-age=${entry ? OG_CACHE_TTL_FOUND : OG_CACHE_TTL_FALLBACK}`,
      ...corsHeaders(),
    },
  });

  await cache.put(cacheKey, response.clone());
  return response;
}

function safeDecodeURIComponent(str: string): string | null {
  try {
    return decodeURIComponent(str);
  } catch {
    return null;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (path === "/api/leaderboard") return handleLeaderboard(env);
    if (path === "/api/health") return handleHealth(env);

    if (path.startsWith("/api/founder/")) {
      const handle = safeDecodeURIComponent(path.slice("/api/founder/".length));
      if (!handle || !isValidHandle(handle)) return jsonResponse({ error: "invalid_handle" }, 400);
      return handleFounder(handle, env);
    }

    if (path.startsWith("/og/")) {
      const handle = safeDecodeURIComponent(path.slice("/og/".length));
      if (!handle || !isValidHandle(handle)) return jsonResponse({ error: "invalid_handle" }, 400);
      return handleOgImage(handle, env, request);
    }

    if (path.startsWith("/founder/")) {
      const handle = safeDecodeURIComponent(path.slice("/founder/".length));
      if (!handle) return jsonResponse({ error: "invalid_handle" }, 400);
      const ua = request.headers.get("User-Agent");

      if (isCrawler(ua) && isValidHandle(handle)) {
        const entry = await findFounder(handle, env);
        if (entry) {
          return new Response(buildCrawlerHtml(entry), {
            headers: { "Content-Type": "text/html", "Cache-Control": "public, max-age=3600" },
          });
        }
      }

      // For browsers, pass through to Pages SPA
      return fetch(request);
    }

    return jsonResponse({ error: "not_found" }, 404);
  },
} satisfies ExportedHandler<Env>;
