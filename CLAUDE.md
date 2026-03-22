# FounderMRR

Public leaderboard of indie founders ranked by verified MRR from TrustMRR.

## Architecture
- Vite + React + TypeScript + Tailwind CSS v4 on Cloudflare Pages
- Worker 1 (`foundermrr-sync`): Cron + manual sync, fetches TrustMRR API, writes to KV
- Worker 2 (`foundermrr-api`): HTTP API + OG image generation, same-origin via Workers Routes
- Cloudflare KV namespace: `FOUNDERMRR_DATA`
- Full architecture in `docs/designs/founder-leaderboard.md`

## Design System
Always read DESIGN.md before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.

Key choices:
- Fonts: Satoshi (headings), DM Sans (body), Geist Mono (revenue figures)
- Colors: Emerald primary (#059669), Amber accent (#D97706), Warm slate neutrals
- OG cards: Light, clean, no borders — white with subtle shadow
