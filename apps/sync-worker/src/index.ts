import {
  type TrustMRRResponse,
  type TrustMRRStartup,
  type LeaderboardData,
  KV_KEYS,
  aggregateFounders,
} from "@foundermrr/shared";

interface Env {
  KV: KVNamespace;
  TRUSTMRR_API_KEY: string;
  ADMIN_KEY: string;
}

const API_BASE = "https://trustmrr.com/api/v1/startups";
const PAGE_LIMIT = 50;
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 2000;
const MAX_RETRIES = 3;
const LOCK_TTL_SECONDS = 300;

async function acquireLock(kv: KVNamespace): Promise<boolean> {
  const existing = await kv.get(KV_KEYS.SYNC_LOCK);
  if (existing) return false;
  await kv.put(KV_KEYS.SYNC_LOCK, "1", { expirationTtl: LOCK_TTL_SECONDS });
  return true;
}

async function releaseLock(kv: KVNamespace): Promise<void> {
  await kv.delete(KV_KEYS.SYNC_LOCK);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPage(
  page: number,
  apiKey: string,
  retries = 0
): Promise<TrustMRRResponse | null> {
  const url = `${API_BASE}?page=${page}&limit=${PAGE_LIMIT}&sort=revenue-desc`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (res.status === 401) {
      console.error("[sync] API key expired or invalid (401)");
      return null;
    }

    if (res.status === 429) {
      if (retries >= MAX_RETRIES) {
        console.error(`[sync] Rate limited on page ${page}, max retries reached`);
        return null;
      }
      const retryAfter = parseInt(res.headers.get("Retry-After") || "60", 10);
      console.warn(`[sync] Rate limited on page ${page}, waiting ${retryAfter}s`);
      await sleep(retryAfter * 1000);
      return fetchPage(page, apiKey, retries + 1);
    }

    if (!res.ok) {
      if (retries < 2) {
        await sleep(2000);
        return fetchPage(page, apiKey, retries + 1);
      }
      console.error(`[sync] Page ${page} failed with status ${res.status}`);
      return null;
    }

    return (await res.json()) as TrustMRRResponse;
  } catch (err) {
    if (retries < 2) {
      await sleep(2000);
      return fetchPage(page, apiKey, retries + 1);
    }
    console.error(`[sync] Network error on page ${page}:`, err);
    return null;
  }
}

async function syncAll(env: Env): Promise<Response> {
  const startTime = Date.now();

  const locked = await acquireLock(env.KV);
  if (!locked) {
    return new Response(JSON.stringify({ status: "skipped", reason: "lock_held" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const allStartups: TrustMRRStartup[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const batch: number[] = [];
      for (let i = 0; i < BATCH_SIZE && hasMore; i++) {
        batch.push(page);
        page++;
        if (batch.length >= BATCH_SIZE) break;
      }

      const results = await Promise.all(
        batch.map((p) => fetchPage(p, env.TRUSTMRR_API_KEY))
      );

      for (const result of results) {
        if (!result) continue;
        allStartups.push(...result.data);
        if (!result.meta.hasMore) hasMore = false;
      }

      if (results[0] === null && allStartups.length === 0) {
        // Auth failure
        await env.KV.put(
          KV_KEYS.SYNC_ERROR,
          JSON.stringify({ error: "api_key_expired", timestamp: new Date().toISOString() })
        );
        await releaseLock(env.KV);
        return new Response(JSON.stringify({ status: "error", reason: "api_key_expired" }), {
          status: 500, headers: { "Content-Type": "application/json" },
        });
      }

      if (results.every((r) => r === null)) break;
      if (hasMore) await sleep(BATCH_DELAY_MS);
    }

    if (allStartups.length === 0) {
      await releaseLock(env.KV);
      return new Response(JSON.stringify({ status: "error", reason: "no_data" }), {
        status: 500, headers: { "Content-Type": "application/json" },
      });
    }

    // Deduplicate startups by slug
    const deduped = [...new Map(allStartups.map((s) => [s.slug, s])).values()];

    // Aggregate by founder (xHandle)
    const founders = aggregateFounders(deduped);

    const leaderboard: LeaderboardData = {
      lastSyncedAt: new Date().toISOString(),
      totalFounders: founders.length,
      totalStartups: deduped.length,
      data: founders,
    };

    await env.KV.put(KV_KEYS.LEADERBOARD, JSON.stringify(leaderboard));
    await env.KV.delete(KV_KEYS.SYNC_ERROR);

    const duration = Date.now() - startTime;
    console.log(`[sync] Completed: ${deduped.length} startups → ${founders.length} founders in ${duration}ms`);

    await releaseLock(env.KV);

    return new Response(
      JSON.stringify({ status: "success", totalStartups: deduped.length, totalFounders: founders.length, durationMs: duration }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[sync] Unexpected error:", err);
    await releaseLock(env.KV);
    return new Response(JSON.stringify({ status: "error", reason: String(err) }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/admin/sync") {
      const adminKey = request.headers.get("X-Admin-Key");
      if (!adminKey || adminKey !== env.ADMIN_KEY) {
        return new Response("Unauthorized", { status: 401 });
      }
      return syncAll(env);
    }
    return new Response("Not Found", { status: 404 });
  },

  async scheduled(_event: ScheduledEvent, env: Env, _ctx: ExecutionContext): Promise<void> {
    console.log("[sync] Cron trigger fired");
    await syncAll(env);
  },
} satisfies ExportedHandler<Env>;
