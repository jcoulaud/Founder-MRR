import {
  type FounderEntry,
  type LeaderboardData,
  KV_KEYS,
  formatRevenueExact,
  formatGrowth,
  escapeHtml,
  isValidHandle,
} from "@foundermrr/shared";
import { ImageResponse, loadGoogleFont } from "workers-og";

interface Env {
  KV: KVNamespace;
}

const CRAWLER_UA_PATTERNS = [
  "Twitterbot", "facebookexternalhit", "LinkedInBot", "Googlebot",
  "Slackbot", "WhatsApp", "TelegramBot", "Discordbot",
];

const OG_CACHE_TTL_FOUND = 21600; // 6 hours
const OG_CACHE_TTL_FALLBACK = 3600; // 1 hour
const OG_CACHE_VERSION = "v3"; // bump to invalidate OG cache on deploy
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

function founderOgHtml(entry: FounderEntry): string {
  const rev = formatRevenueExact(entry.totalRevenue30d);
  const growth = formatGrowth(entry.avgGrowth30d);
  const startupNames = entry.startups.slice(0, 3).map((s) => escapeHtml(s.name)).join(", ");
  const more = entry.startupCount > 3 ? ` +${entry.startupCount - 3}` : "";
  const growthColor = entry.avgGrowth30d !== null && entry.avgGrowth30d > 0 ? "#059669" : "#DC2626";
  const hasGrowth = growth !== null;

  return `<div style="display:flex;flex-direction:column;width:1200px;height:630px;background:#FFFFFF;font-family:'DM Sans',sans-serif;border:4px solid #E2E8F0;box-sizing:border-box;">
  
  <!-- Body -->
  <div style="display:flex;flex:1;flex-direction:column;justify-content:center;padding:0 60px;">
    <div style="display:flex;align-items:center;gap:24px;margin-bottom:24px;">
      <div style="display:flex;font-size:24px;font-weight:700;color:#059669;letter-spacing:3px;text-transform:uppercase;">
        Verified Founder
      </div>
      <div style="display:flex;background:#FFFBEB;border:2px solid #FBBF24;color:#D97706;padding:8px 20px;border-radius:12px;font-size:20px;font-weight:700;font-family:'Satoshi',sans-serif;letter-spacing:1px;">
        RANK #${entry.rank}
      </div>
    </div>
    <div style="display:flex;font-size:120px;font-family:'Satoshi',sans-serif;font-weight:900;color:#0F172A;letter-spacing:-4px;line-height:1;">
      @${escapeHtml(entry.xHandle)}
    </div>
    <div style="display:flex;flex-direction:column;margin-top:24px;">
      <div style="display:flex;font-size:40px;color:#64748B;font-weight:500;">Building ${startupNames}${more}</div>
    </div>
  </div>

  <!-- Footer Metrics -->
  <div style="display:flex;width:100%;height:200px;border-top:2px solid #E2E8F0;">
    <div style="display:flex;flex:1;flex-direction:column;justify-content:center;padding:0 60px;border-right:2px solid #E2E8F0;background:#F8FAFC;">
      <div style="display:flex;font-size:18px;font-weight:700;color:#64748B;letter-spacing:4px;text-transform:uppercase;margin-bottom:16px;">
        VERIFIED MRR (30D)
      </div>
      <div style="display:flex;align-items:flex-end;">
        <div style="display:flex;font-size:80px;font-family:'Geist Mono',monospace;font-weight:700;color:#0F172A;letter-spacing:-3px;line-height:1;">
          ${rev}
        </div>
        <div style="display:flex;font-size:32px;font-family:'Geist Mono',monospace;font-weight:500;color:#94A3B8;margin-left:12px;line-height:1.2;margin-bottom:8px;">
          /mo
        </div>
      </div>
    </div>
    
    ${hasGrowth ? `
    <div style="display:flex;width:400px;flex-direction:column;justify-content:center;padding:0 60px;background:#FFFFFF;">
      <div style="display:flex;font-size:18px;font-weight:700;color:#64748B;letter-spacing:4px;text-transform:uppercase;margin-bottom:16px;">
        30D GROWTH
      </div>
      <div style="display:flex;font-size:80px;font-family:'Geist Mono',monospace;font-weight:700;color:${growthColor};letter-spacing:-3px;line-height:1;">
        ${growth}
      </div>
    </div>
    ` : `
    <div style="display:flex;width:400px;flex-direction:column;justify-content:center;padding:0 60px;background:#FFFFFF;">
      <div style="display:flex;font-size:18px;font-weight:700;color:#64748B;letter-spacing:4px;text-transform:uppercase;margin-bottom:16px;">
        STATUS
      </div>
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="display:flex;width:24px;height:24px;background:#059669;border-radius:12px;"></div>
        <div style="display:flex;font-size:40px;font-family:'Satoshi',sans-serif;font-weight:700;color:#0F172A;line-height:1;">
          Verified
        </div>
      </div>
    </div>
    `}
  </div>
</div>`;
}

function homeOgHtml(data: LeaderboardData): string {
  const top5 = data.data.slice(0, 5);
  const rows = top5.map((f, i) => {
    const rev = formatRevenueExact(f.totalRevenue30d);
    return `<div style="display:flex;align-items:center;width:100%;flex:1;border-bottom:${i < 4 ? '1px solid #E2E8F0' : '0'};padding:0 60px;">
      <div style="display:flex;font-family:'Geist Mono',monospace;font-size:32px;font-weight:700;color:${i < 3 ? '#D97706' : '#94A3B8'};width:100px;">
        #${f.rank}
      </div>
      <div style="display:flex;flex:1;font-size:40px;font-family:'Satoshi',sans-serif;font-weight:900;color:#0F172A;letter-spacing:-1px;">
        @${escapeHtml(f.xHandle)}
      </div>
      <div style="display:flex;align-items:flex-end;justify-content:flex-end;">
        <div style="display:flex;font-family:'Geist Mono',monospace;font-size:40px;font-weight:700;color:#059669;letter-spacing:-2px;line-height:1;">
          ${rev}
        </div>
        <div style="display:flex;font-family:'Geist Mono',monospace;font-size:24px;font-weight:500;color:#64748B;margin-left:8px;line-height:1.2;margin-bottom:4px;">
          /mo
        </div>
      </div>
    </div>`;
  }).join("");

  return `<div style="display:flex;flex-direction:column;width:1200px;height:630px;background:#FFFFFF;font-family:'DM Sans',sans-serif;border:4px solid #E2E8F0;box-sizing:border-box;">
  
  <!-- Title Section -->
  <div style="display:flex;flex-direction:column;justify-content:center;padding:48px 60px 48px 60px;border-bottom:2px solid #E2E8F0;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div style="display:flex;font-size:64px;font-family:'Satoshi',sans-serif;font-weight:900;color:#0F172A;letter-spacing:-2px;line-height:1;">
        Startup Revenue Leaderboard
      </div>
      <div style="display:flex;font-size:24px;font-weight:700;color:#059669;letter-spacing:2px;text-transform:uppercase;">
        ${data.totalFounders.toLocaleString()} Verified Founders
      </div>
    </div>
    <div style="display:flex;font-size:28px;color:#64748B;margin-top:16px;font-weight:500;">
      Founders ranked by verified Stripe revenue.
    </div>
  </div>

  <!-- Rows -->
  <div style="display:flex;flex-direction:column;flex:1;background:#FFFFFF;">
    ${rows}
  </div>

</div>`;
}

function fallbackOgHtml(): string {
  return `<div style="display:flex;flex-direction:column;width:1200px;height:630px;background:#FFFFFF;font-family:'DM Sans',sans-serif;border:4px solid #E2E8F0;box-sizing:border-box;">
  
  <!-- Body -->
  <div style="display:flex;flex:1;flex-direction:column;justify-content:center;padding:0 80px;background:#FFFFFF;">
    <div style="display:flex;font-size:32px;font-weight:700;color:#059669;letter-spacing:3px;text-transform:uppercase;margin-bottom:24px;">
      Startup Revenue Leaderboard
    </div>
    <div style="display:flex;font-size:120px;font-family:'Satoshi',sans-serif;font-weight:900;color:#0F172A;letter-spacing:-4px;line-height:1;">
      FounderMRR
    </div>
    <div style="display:flex;flex-direction:column;margin-top:32px;">
      <div style="display:flex;font-size:40px;color:#64748B;font-weight:500;">Founders ranked by verified Stripe revenue.</div>
      <div style="display:flex;font-size:40px;color:#64748B;font-weight:500;margin-top:12px;">Real MRR data from TrustMRR, updated daily.</div>
    </div>
  </div>
</div>`;
}

let fontsCache: { dmSansReg: ArrayBuffer, dmSansBold: ArrayBuffer, dmSansBlack: ArrayBuffer, geistMonoBold: ArrayBuffer, geistMonoMed: ArrayBuffer, satoshiBlack: ArrayBuffer } | null = null;

async function getFonts() {
  if (fontsCache) return fontsCache;
  const [dmSansReg, dmSansBold, dmSansBlack, geistMonoBold, geistMonoMed] = await Promise.all([
    loadGoogleFont({ family: "DM Sans", weight: 500 }),
    loadGoogleFont({ family: "DM Sans", weight: 700 }),
    loadGoogleFont({ family: "DM Sans", weight: 900 }),
    loadGoogleFont({ family: "Geist Mono", weight: 700 }),
    loadGoogleFont({ family: "Geist Mono", weight: 500 })
  ]);
  
  // Try to load Satoshi, but if it fails (like XML error) fallback safely
  let satoshiBlack = dmSansBlack;
  try {
    const cssRes = await fetch("https://api.fontshare.com/v2/css?f[]=satoshi@900&display=swap");
    if (cssRes.ok) {
      const css = await cssRes.text();
      const urlMatch = css.match(/url\((['"]?)(https:\/\/[^'"]+)\1\)/);
      if (urlMatch && urlMatch[2]) {
        const fontRes = await fetch(urlMatch[2]);
        if (fontRes.ok) {
          const buffer = await fontRes.arrayBuffer();
          // Ensure it's not an XML error page by checking the first few bytes
          const view = new Uint8Array(buffer);
          if (view.length > 4 && !(view[0] === 0x3C && view[1] === 0x3F && view[2] === 0x78 && view[3] === 0x6D)) { // <?xm
            satoshiBlack = buffer;
          }
        }
      }
    }
  } catch (e) {
    // Ignore and use fallback
  }

  fontsCache = { dmSansReg, dmSansBold, dmSansBlack, geistMonoBold, geistMonoMed, satoshiBlack };
  return fontsCache;
}

async function handleOgImage(handle: string, env: Env, request: Request): Promise<Response> {
  const cacheUrl = new URL(request.url);
  cacheUrl.searchParams.set("_ogv", OG_CACHE_VERSION);
  const cacheKey = new Request(cacheUrl.toString());
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const entry = await findFounder(handle, env);
  const html = entry ? founderOgHtml(entry) : fallbackOgHtml();
  const fonts = await getFonts();

  const response = new ImageResponse(html, {
    width: 1200,
    height: 630,
    fonts: [
      { name: "DM Sans", data: fonts.dmSansReg, weight: 500, style: "normal" },
      { name: "DM Sans", data: fonts.dmSansBold, weight: 700, style: "normal" },
      { name: "DM Sans", data: fonts.dmSansBlack, weight: 900, style: "normal" },
      { name: "Geist Mono", data: fonts.geistMonoMed, weight: 500, style: "normal" },
      { name: "Geist Mono", data: fonts.geistMonoBold, weight: 700, style: "normal" },
      { name: "Satoshi", data: fonts.satoshiBlack, weight: 900, style: "normal" }
    ],
  });

  // Clone and add cache headers
  const cachedResponse = new Response(response.body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": `public, max-age=${entry ? OG_CACHE_TTL_FOUND : OG_CACHE_TTL_FALLBACK}`,
      ...corsHeaders(),
    },
  });

  await cache.put(cacheKey, cachedResponse.clone());
  return cachedResponse;
}

async function handleHomeOgImage(env: Env, request: Request): Promise<Response> {
  const cacheUrl = new URL(request.url);
  cacheUrl.searchParams.set("_ogv", OG_CACHE_VERSION);
  const cacheKey = new Request(cacheUrl.toString());
  const cache = caches.default;
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  const data = await getLeaderboard(env);
  const html = data ? homeOgHtml(data) : fallbackOgHtml();
  const fonts = await getFonts();

  const response = new ImageResponse(html, {
    width: 1200,
    height: 630,
    fonts: [
      { name: "DM Sans", data: fonts.dmSansReg, weight: 500, style: "normal" },
      { name: "DM Sans", data: fonts.dmSansBold, weight: 700, style: "normal" },
      { name: "DM Sans", data: fonts.dmSansBlack, weight: 900, style: "normal" },
      { name: "Geist Mono", data: fonts.geistMonoMed, weight: 500, style: "normal" },
      { name: "Geist Mono", data: fonts.geistMonoBold, weight: 700, style: "normal" },
      { name: "Satoshi", data: fonts.satoshiBlack, weight: 900, style: "normal" }
    ],
  });

  const cachedResponse = new Response(response.body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": `public, max-age=${OG_CACHE_TTL_FOUND}`,
      ...corsHeaders(),
    },
  });

  await cache.put(cacheKey, cachedResponse.clone());
  return cachedResponse;
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

    if (path === "/og/home") {
      return handleHomeOgImage(env, request);
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
