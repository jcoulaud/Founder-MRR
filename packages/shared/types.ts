export interface TrustMRRStartup {
  name: string;
  slug: string;
  url: string;
  icon: string | null;
  description: string | null;
  website: string | null;
  country: string | null;
  foundedDate: string | null;
  category: string | null;
  paymentProvider: string;
  targetAudience: string | null;
  revenue: {
    last30Days: number;
    mrr: number;
    total: number;
  };
  customers: number;
  activeSubscriptions: number;
  askingPrice: number | null;
  profitMarginLast30Days: number | null;
  growth30d: number | null;
  growthMRR30d: number | null;
  multiple: number | null;
  rank: number | null;
  visitorsLast30Days: number | null;
  googleSearchImpressionsLast30Days: number | null;
  revenuePerVisitor: number | null;
  onSale: boolean;
  firstListedForSaleAt: string | null;
  xHandle: string | null;
}

export interface TrustMRRResponse {
  data: TrustMRRStartup[];
  meta: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
}

/** A single startup, simplified for display */
export interface StartupEntry {
  name: string;
  slug: string;
  icon: string | null;
  website: string | null;
  category: string | null;
  mrr: number;
  revenue30d: number;
  revenueTotal: number;
  growth30d: number | null;
  onSale: boolean;
}

/** A founder = aggregation of all their startups */
export interface FounderEntry {
  xHandle: string;
  rank: number;
  startupCount: number;
  totalRevenue30d: number;
  totalMrr: number;
  totalRevenueAllTime: number;
  totalSubscriptions: number;
  /** Weighted average growth across startups with revenue */
  avgGrowth30d: number | null;
  /** Categories across all startups */
  categories: string[];
  country: string | null;
  /** Their startups, sorted by revenue30d desc */
  startups: StartupEntry[];
}

export interface LeaderboardData {
  lastSyncedAt: string;
  totalFounders: number;
  totalStartups: number;
  data: FounderEntry[];
}

export const KV_KEYS = {
  LEADERBOARD: "leaderboard",
  SYNC_LOCK: "sync-lock",
  SYNC_ERROR: "sync-error",
} as const;

export function aggregateFounders(startups: TrustMRRStartup[]): FounderEntry[] {
  const grouped = new Map<string, TrustMRRStartup[]>();

  for (const s of startups) {
    if (!s.xHandle) continue; // Skip startups without a founder handle
    const existing = grouped.get(s.xHandle) || [];
    existing.push(s);
    grouped.set(s.xHandle, existing);
  }

  const founders: FounderEntry[] = [];

  for (const [handle, slist] of grouped) {
    const totalRevenue30d = slist.reduce((sum, s) => sum + s.revenue.last30Days, 0);
    const totalMrr = slist.reduce((sum, s) => sum + s.revenue.mrr, 0);
    const totalRevenueAllTime = slist.reduce((sum, s) => sum + s.revenue.total, 0);
    const totalSubscriptions = slist.reduce((sum, s) => sum + s.activeSubscriptions, 0);

    // Weighted average growth (weighted by revenue30d)
    let avgGrowth: number | null = null;
    const withGrowth = slist.filter((s) => s.growth30d !== null && s.revenue.last30Days > 0);
    if (withGrowth.length > 0) {
      const totalWeight = withGrowth.reduce((sum, s) => sum + s.revenue.last30Days, 0);
      if (totalWeight > 0) {
        avgGrowth = withGrowth.reduce((sum, s) => sum + s.growth30d! * s.revenue.last30Days, 0) / totalWeight;
      }
    }

    // Unique categories
    const categories = [...new Set(slist.map((s) => s.category).filter((c): c is string => c !== null))];

    // Country from first startup that has one
    const country = slist.find((s) => s.country)?.country || null;

    // Map startups, sorted by revenue desc
    const startupEntries: StartupEntry[] = slist
      .map((s) => ({
        name: s.name,
        slug: s.slug,
        icon: s.icon,
        website: s.website,
        category: s.category,
        mrr: s.revenue.mrr,
        revenue30d: s.revenue.last30Days,
        revenueTotal: s.revenue.total,
        growth30d: s.growth30d,
        onSale: s.onSale,
      }))
      .sort((a, b) => b.revenue30d - a.revenue30d);

    founders.push({
      xHandle: handle,
      rank: 0, // assigned after sorting
      startupCount: slist.length,
      totalRevenue30d,
      totalMrr,
      totalRevenueAllTime,
      totalSubscriptions,
      avgGrowth30d: avgGrowth,
      categories,
      country,
      startups: startupEntries,
    });
  }

  // Sort by total revenue (30d) descending
  founders.sort((a, b) => b.totalRevenue30d - a.totalRevenue30d);

  // Assign ranks
  founders.forEach((f, i) => {
    f.rank = i + 1;
  });

  return founders;
}

/** Add thousands separators (locale-independent) */
function addCommas(n: number): string {
  const s = String(n);
  const parts: string[] = [];
  for (let i = s.length; i > 0; i -= 3) {
    parts.unshift(s.slice(Math.max(0, i - 3), i));
  }
  return parts.join(",");
}

/** Format a dollar value for compact display (e.g. $71K, $3.1M) */
export function formatRevenue(dollars: number): string {
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (dollars >= 1_000) return `$${addCommas(Math.round(dollars / 1_000))}K`;
  return `$${addCommas(Math.round(dollars))}`;
}

/** Format a dollar value with full precision (e.g. $71,439) */
export function formatRevenueExact(dollars: number): string {
  return `$${addCommas(Math.round(dollars))}`;
}

/** Escape string for safe embedding in HTML/XML attributes and content */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/** Validate that a string is a safe X/Twitter handle */
export function isValidHandle(handle: string): boolean {
  return /^[a-zA-Z0-9_]{1,15}$/.test(handle);
}

export function formatGrowth(growth: number | null): string | null {
  if (growth === null) return null;
  if (growth === 0) return "0%";
  const sign = growth > 0 ? "+" : "";
  const rounded = Math.round(Math.abs(growth));
  const formatted = rounded.toLocaleString("en-US");
  return `${sign}${growth < 0 ? "-" : ""}${formatted}%`;
}
