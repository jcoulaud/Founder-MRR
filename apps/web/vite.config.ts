import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Dev-only mock data — serves when no VITE_API_URL is configured.
// To use real data in dev: VITE_API_URL=https://your-api.workers.dev bun run dev
const MOCK_DATA = {
  lastSyncedAt: new Date().toISOString(),
  totalFounders: 12,
  totalStartups: 18,
  data: [
    { xHandle: "marc_louvion", rank: 1, startupCount: 3, totalRevenue30d: 71439, totalMrr: 71439, totalRevenueAllTime: 1285000, totalSubscriptions: 1842, avgGrowth30d: 9.4, categories: ["SaaS", "AI"], country: "FR", startups: [{ name: "ShipFast", slug: "shipfast", icon: null, website: "https://shipfa.st", category: "SaaS", mrr: 52000, revenue30d: 52000, revenueTotal: 940000, growth30d: 12.3, onSale: false }, { name: "ByeDispute", slug: "byedispute", icon: null, website: null, category: "SaaS", mrr: 11200, revenue30d: 11200, revenueTotal: 201600, growth30d: 5.1, onSale: false }, { name: "ZenVoice", slug: "zenvoice", icon: null, website: null, category: "AI", mrr: 8239, revenue30d: 8239, revenueTotal: 143400, growth30d: 3.2, onSale: false }] },
    { xHandle: "dankulakov", rank: 2, startupCount: 2, totalRevenue30d: 54200, totalMrr: 54200, totalRevenueAllTime: 976000, totalSubscriptions: 1205, avgGrowth30d: 15.2, categories: ["Developer Tools"], country: "US", startups: [{ name: "Makerkit", slug: "makerkit", icon: null, website: null, category: "Developer Tools", mrr: 42000, revenue30d: 42000, revenueTotal: 756000, growth30d: 18.1, onSale: false }, { name: "SideProject", slug: "sideproject", icon: null, website: null, category: "Developer Tools", mrr: 12200, revenue30d: 12200, revenueTotal: 220000, growth30d: 8.4, onSale: false }] },
    { xHandle: "taborsky_en", rank: 3, startupCount: 1, totalRevenue30d: 47800, totalMrr: 47800, totalRevenueAllTime: 860000, totalSubscriptions: 890, avgGrowth30d: -2.1, categories: ["SaaS"], country: "CZ", startups: [{ name: "Churnkey", slug: "churnkey", icon: null, website: null, category: "SaaS", mrr: 47800, revenue30d: 47800, revenueTotal: 860000, growth30d: -2.1, onSale: false }] },
    { xHandle: "paborji", rank: 4, startupCount: 2, totalRevenue30d: 38500, totalMrr: 38500, totalRevenueAllTime: 693000, totalSubscriptions: 780, avgGrowth30d: 22.7, categories: ["SaaS", "Productivity"], country: "IN", startups: [{ name: "FeedHive", slug: "feedhive", icon: null, website: null, category: "SaaS", mrr: 28500, revenue30d: 28500, revenueTotal: 513000, growth30d: 25.0, onSale: false }, { name: "TaskBot", slug: "taskbot", icon: null, website: null, category: "Productivity", mrr: 10000, revenue30d: 10000, revenueTotal: 180000, growth30d: 15.1, onSale: true }] },
    { xHandle: "julienrenaux", rank: 5, startupCount: 1, totalRevenue30d: 31200, totalMrr: 31200, totalRevenueAllTime: 562000, totalSubscriptions: 645, avgGrowth30d: 7.8, categories: ["Developer Tools"], country: "FR", startups: [{ name: "FormBold", slug: "formbold", icon: null, website: null, category: "Developer Tools", mrr: 31200, revenue30d: 31200, revenueTotal: 562000, growth30d: 7.8, onSale: false }] },
    { xHandle: "maboroshi", rank: 6, startupCount: 1, totalRevenue30d: 24300, totalMrr: 24300, totalRevenueAllTime: 437000, totalSubscriptions: 512, avgGrowth30d: null, categories: ["E-commerce"], country: "JP", startups: [{ name: "ShopFlow", slug: "shopflow", icon: null, website: null, category: "E-commerce", mrr: 24300, revenue30d: 24300, revenueTotal: 437000, growth30d: null, onSale: false }] },
    { xHandle: "elonmsk", rank: 7, startupCount: 2, totalRevenue30d: 19800, totalMrr: 19800, totalRevenueAllTime: 356000, totalSubscriptions: 423, avgGrowth30d: 45.2, categories: ["AI", "Marketing"], country: "US", startups: [{ name: "ContentAI", slug: "contentai", icon: null, website: null, category: "AI", mrr: 14200, revenue30d: 14200, revenueTotal: 256000, growth30d: 52.1, onSale: false }, { name: "AdBoost", slug: "adboost", icon: null, website: null, category: "Marketing", mrr: 5600, revenue30d: 5600, revenueTotal: 100000, growth30d: 31.4, onSale: false }] },
    { xHandle: "sarahcodes", rank: 8, startupCount: 1, totalRevenue30d: 15600, totalMrr: 15600, totalRevenueAllTime: 280000, totalSubscriptions: 334, avgGrowth30d: 3.2, categories: ["Design"], country: "UK", startups: [{ name: "DesignJar", slug: "designjar", icon: null, website: null, category: "Design", mrr: 15600, revenue30d: 15600, revenueTotal: 280000, growth30d: 3.2, onSale: false }] },
    { xHandle: "buildermax", rank: 9, startupCount: 1, totalRevenue30d: 11200, totalMrr: 11200, totalRevenueAllTime: 201600, totalSubscriptions: 245, avgGrowth30d: -5.3, categories: ["Analytics"], country: "DE", startups: [{ name: "MetricFlow", slug: "metricflow", icon: null, website: null, category: "Analytics", mrr: 11200, revenue30d: 11200, revenueTotal: 201600, growth30d: -5.3, onSale: true }] },
    { xHandle: "indiefounder", rank: 10, startupCount: 1, totalRevenue30d: 8400, totalMrr: 8400, totalRevenueAllTime: 151200, totalSubscriptions: 178, avgGrowth30d: 128.5, categories: ["SaaS"], country: "BR", startups: [{ name: "LaunchPad", slug: "launchpad", icon: null, website: null, category: "SaaS", mrr: 8400, revenue30d: 8400, revenueTotal: 151200, growth30d: 128.5, onSale: false }] },
    { xHandle: "devguru42", rank: 11, startupCount: 1, totalRevenue30d: 5200, totalMrr: 5200, totalRevenueAllTime: 93600, totalSubscriptions: 112, avgGrowth30d: 67.3, categories: ["Education"], country: "CA", startups: [{ name: "CodeMentor", slug: "codementor", icon: null, website: null, category: "Education", mrr: 5200, revenue30d: 5200, revenueTotal: 93600, growth30d: 67.3, onSale: false }] },
    { xHandle: "startupjane", rank: 12, startupCount: 1, totalRevenue30d: 2100, totalMrr: 2100, totalRevenueAllTime: 37800, totalSubscriptions: 45, avgGrowth30d: 210.3, categories: ["Productivity"], country: "AU", startups: [{ name: "FlowState", slug: "flowstate", icon: null, website: null, category: "Productivity", mrr: 2100, revenue30d: 2100, revenueTotal: 37800, growth30d: 210.3, onSale: false }] },
  ],
};

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Only serve mock data when no API URL is configured
    ...(!process.env.VITE_API_URL ? [{
      name: "mock-api",
      configureServer(server: any) {
        server.middlewares.use("/api/leaderboard", (_req: any, res: any) => {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(MOCK_DATA));
        });
      },
    }] : []),
  ],
  resolve: {
    alias: {
      "@foundermrr/shared": path.resolve(__dirname, "../../packages/shared/types.ts"),
    },
  },
  server: {
    proxy: process.env.VITE_API_URL
      ? { "/api": { target: process.env.VITE_API_URL, changeOrigin: true } }
      : undefined,
  },
});
