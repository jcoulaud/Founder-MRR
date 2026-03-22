import { describe, it, expect } from "vitest";
import {
  aggregateFounders,
  formatRevenue,
  formatRevenueExact,
  formatGrowth,
  escapeHtml,
  isValidHandle,
  type TrustMRRStartup,
} from "./types";

function makeStartup(overrides: Partial<TrustMRRStartup> = {}): TrustMRRStartup {
  return {
    name: "TestApp",
    slug: "testapp",
    url: "https://trustmrr.com/testapp",
    icon: null,
    description: null,
    website: null,
    country: null,
    foundedDate: null,
    category: "SaaS",
    paymentProvider: "stripe",
    targetAudience: null,
    revenue: { last30Days: 1000, mrr: 1000, total: 10000 },
    customers: 50,
    activeSubscriptions: 50,
    askingPrice: null,
    profitMarginLast30Days: null,
    growth30d: 5.0,
    growthMRR30d: null,
    multiple: null,
    rank: 1,
    visitorsLast30Days: null,
    googleSearchImpressionsLast30Days: null,
    revenuePerVisitor: null,
    onSale: false,
    firstListedForSaleAt: null,
    xHandle: "testuser",
    ...overrides,
  };
}

describe("formatRevenue", () => {
  it("formats millions", () => {
    expect(formatRevenue(1_500_000)).toBe("$1.5M");
    expect(formatRevenue(3_000_000)).toBe("$3.0M");
  });

  it("formats thousands", () => {
    expect(formatRevenue(71_439)).toBe("$71K");
    expect(formatRevenue(1_000)).toBe("$1K");
  });

  it("formats small values", () => {
    expect(formatRevenue(500)).toBe("$500");
    expect(formatRevenue(0)).toBe("$0");
  });
});

describe("formatRevenueExact", () => {
  it("formats with commas", () => {
    expect(formatRevenueExact(71439)).toBe("$71,439");
    expect(formatRevenueExact(1000)).toBe("$1,000");
    expect(formatRevenueExact(500)).toBe("$500");
    expect(formatRevenueExact(1_500_000)).toBe("$1,500,000");
  });
});

describe("formatGrowth", () => {
  it("returns null for null", () => {
    expect(formatGrowth(null)).toBeNull();
  });

  it("returns 0.0% for zero", () => {
    expect(formatGrowth(0)).toBe("0.0%");
  });

  it("formats positive growth with +", () => {
    expect(formatGrowth(9.4)).toBe("+9.4%");
    expect(formatGrowth(0.1)).toBe("+0.1%");
  });

  it("formats negative growth", () => {
    expect(formatGrowth(-2.1)).toBe("-2.1%");
  });
});

describe("escapeHtml", () => {
  it("escapes special characters", () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
    );
  });

  it("escapes ampersands", () => {
    expect(escapeHtml("a & b")).toBe("a &amp; b");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("it's")).toBe("it&#x27;s");
  });

  it("returns empty string unchanged", () => {
    expect(escapeHtml("")).toBe("");
  });
});

describe("isValidHandle", () => {
  it("accepts valid handles", () => {
    expect(isValidHandle("marc_louvion")).toBe(true);
    expect(isValidHandle("a")).toBe(true);
    expect(isValidHandle("Test123_")).toBe(true);
  });

  it("rejects invalid handles", () => {
    expect(isValidHandle("")).toBe(false);
    expect(isValidHandle("has spaces")).toBe(false);
    expect(isValidHandle("has-dashes")).toBe(false);
    expect(isValidHandle('"><script>')).toBe(false);
    expect(isValidHandle("a".repeat(16))).toBe(false);
  });
});

describe("aggregateFounders", () => {
  it("groups startups by xHandle", () => {
    const startups = [
      makeStartup({ name: "App1", slug: "app1", xHandle: "founder1", revenue: { last30Days: 5000, mrr: 5000, total: 50000 } }),
      makeStartup({ name: "App2", slug: "app2", xHandle: "founder1", revenue: { last30Days: 3000, mrr: 3000, total: 30000 } }),
      makeStartup({ name: "App3", slug: "app3", xHandle: "founder2", revenue: { last30Days: 10000, mrr: 10000, total: 100000 } }),
    ];
    const founders = aggregateFounders(startups);
    expect(founders).toHaveLength(2);
    expect(founders[0]!.xHandle).toBe("founder2");
    expect(founders[0]!.totalRevenue30d).toBe(10000);
    expect(founders[1]!.xHandle).toBe("founder1");
    expect(founders[1]!.totalRevenue30d).toBe(8000);
    expect(founders[1]!.startupCount).toBe(2);
  });

  it("assigns ranks based on revenue", () => {
    const startups = [
      makeStartup({ slug: "a", xHandle: "low", revenue: { last30Days: 100, mrr: 100, total: 1000 } }),
      makeStartup({ slug: "b", xHandle: "high", revenue: { last30Days: 9000, mrr: 9000, total: 90000 } }),
    ];
    const founders = aggregateFounders(startups);
    expect(founders[0]!.rank).toBe(1);
    expect(founders[0]!.xHandle).toBe("high");
    expect(founders[1]!.rank).toBe(2);
  });

  it("skips startups without xHandle", () => {
    const startups = [
      makeStartup({ slug: "a", xHandle: null }),
      makeStartup({ slug: "b", xHandle: "valid" }),
    ];
    const founders = aggregateFounders(startups);
    expect(founders).toHaveLength(1);
    expect(founders[0]!.xHandle).toBe("valid");
  });

  it("calculates weighted average growth", () => {
    const startups = [
      makeStartup({ slug: "a", xHandle: "f1", revenue: { last30Days: 8000, mrr: 8000, total: 80000 }, growth30d: 10.0 }),
      makeStartup({ slug: "b", xHandle: "f1", revenue: { last30Days: 2000, mrr: 2000, total: 20000 }, growth30d: 20.0 }),
    ];
    const founders = aggregateFounders(startups);
    // Weighted: (10*8000 + 20*2000) / (8000+2000) = 120000/10000 = 12
    expect(founders[0]!.avgGrowth30d).toBe(12);
  });

  it("returns null growth when no startups have growth data", () => {
    const startups = [
      makeStartup({ slug: "a", xHandle: "f1", growth30d: null }),
    ];
    const founders = aggregateFounders(startups);
    expect(founders[0]!.avgGrowth30d).toBeNull();
  });

  it("extracts unique categories", () => {
    const startups = [
      makeStartup({ slug: "a", xHandle: "f1", category: "SaaS" }),
      makeStartup({ slug: "b", xHandle: "f1", category: "SaaS" }),
      makeStartup({ slug: "c", xHandle: "f1", category: "AI" }),
    ];
    const founders = aggregateFounders(startups);
    expect(founders[0]!.categories).toEqual(["SaaS", "AI"]);
  });
});
