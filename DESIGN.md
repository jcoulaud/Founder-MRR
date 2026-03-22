# Design System — FounderMRR

## Product Context
- **What this is:** A public leaderboard ranking indie founders by verified Monthly Recurring Revenue from TrustMRR
- **Who it's for:** Indie founders/SaaS builders, investors, the X/Twitter indie hacker community
- **Space/industry:** Indie SaaS leaderboards (peers: TrustMRR, IndieHackers, Failory)
- **Project type:** Data-driven web app with public/marketing characteristics

## Aesthetic Direction
- **Direction:** Industrial/Utilitarian — clean data presentation where the numbers are the hero
- **Decoration level:** Minimal — typography and whitespace do all the work
- **Mood:** Authoritative, precise, trustworthy. The confidence of verified financial data. Not playful, not corporate. Think "Bloomberg for indie founders" but approachable.
- **Reference sites:** TrustMRR (data source, clean but generic), IndieHackers (dark hacker vibe — we deliberately diverge)

## Typography
- **Display/Hero:** Satoshi (900, 700) — geometric, modern, warm but confident. Distinctive in this space.
  - `font-family: 'Satoshi', sans-serif`
  - Loading: `https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap`
- **Body:** DM Sans (400, 500, 700) — clean at small sizes, excellent readability
  - `font-family: 'DM Sans', sans-serif`
  - Loading: Google Fonts
- **UI/Labels:** DM Sans (same as body)
- **Data/Revenue figures:** Geist Mono (400, 500, 600) — monospace for dollar amounts adds financial precision
  - `font-family: 'Geist Mono', monospace`
  - Use for: revenue values ($71,439/mo), growth percentages (+9.4%), tabular data
  - `font-variant-numeric: tabular-nums` for column alignment
  - Loading: Google Fonts or Vercel CDN
- **Code:** Geist Mono
- **Scale:**
  - 3xl: 48px / 3rem (hero headings)
  - 2xl: 32px / 2rem (page headings)
  - xl: 24px / 1.5rem (section headings)
  - lg: 20px / 1.25rem (subheadings)
  - base: 16px / 1rem (body)
  - sm: 14px / 0.875rem (table cells, UI)
  - xs: 13px / 0.8125rem (labels, captions)
  - 2xs: 12px / 0.75rem (meta text, pill counts)
  - 3xs: 11px / 0.6875rem (uppercase labels)

## Color
- **Approach:** Restrained — one strong accent + neutrals. Color is used meaningfully, not decoratively.
- **Primary (Emerald):**
  - 600: `#059669` — primary buttons, links, growth arrows, brand color
  - 500: `#10B981` — hover states
  - 700: `#047857` — active/pressed states
  - 100: `#D1FAE5` — light backgrounds (badges, avatars)
  - 50: `#ECFDF5` — subtle backgrounds
- **Accent (Amber):**
  - 600: `#D97706` — rank badges, Rising Stars, achievement highlights
  - 500: `#F59E0B` — hover states
  - 400: `#FBBF24` — OG card rank text
  - 100: `#FEF3C7` — amber badge backgrounds
  - 50: `#FFFBEB` — Rising Stars section background
- **Neutrals (Warm Slate):**
  - 900: `#0F172A` — primary text
  - 800: `#1E293B` — headings
  - 700: `#334155` — secondary text (emphasis)
  - 600: `#475569` — secondary text
  - 500: `#64748B` — muted text
  - 400: `#94A3B8` — placeholder text, meta
  - 300: `#CBD5E1` — borders (hover)
  - 200: `#E2E8F0` — borders, dividers
  - 100: `#F1F5F9` — alternate row backgrounds
  - 50: `#F8FAFC` — page background (sections)
- **Semantic:**
  - Success: `#059669` (emerald-600, same as primary)
  - Warning: `#D97706` (amber-600, same as accent)
  - Error: `#DC2626`
  - Info: `#2563EB`
- **Background:** `#FFFFFF` main, `#F8FAFC` for alternate sections/rows
- **No dark mode** (explicitly skipped per user preference)

## Spacing
- **Base unit:** 8px
- **Density:** Comfortable — data-focused but not cramped
- **Scale:**
  - 2xs: 2px
  - xs: 4px
  - sm: 8px
  - md: 16px
  - lg: 24px
  - xl: 32px
  - 2xl: 48px
  - 3xl: 64px

## Layout
- **Approach:** Grid-disciplined — leaderboard table demands perfect column alignment
- **Max content width:** 1120px
- **Grid:** Single column layout (leaderboard is a table, not a multi-column grid)
- **Border radius:**
  - sm: 4px (small elements)
  - md: 8px (buttons, inputs, cards)
  - lg: 12px (containers, mockup frames)
  - full: 9999px (pills, badges, avatars)
- **Table row height:** ~52px (14px padding top/bottom + content)
- **Section separation:** 1px solid `#E2E8F0` borders between sections

## Motion
- **Approach:** Minimal-functional — only transitions that aid comprehension
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(50-100ms) short(150ms) medium(250ms)
- **Used for:** table row hover, button state changes, filter/sort transitions, page transitions
- **NOT used for:** scroll animations, entrance animations, bouncy effects, decorative motion

## Component Patterns

### Rank Badges
- #1: Amber background (`#FEF3C7`), amber text (`#B45309`)
- #2: Slate background (`#F1F5F9`), slate text (`#475569`)
- #3: Light amber background (`#FFFBEB`), amber text (`#D97706`)
- #4+: Slate-50 background, slate-500 text
- Size: 28x28px, border-radius: 6px, Satoshi 700 13px

### Category Filter Pills
- Default: white bg, 1px slate-200 border, slate-600 text
- Active: emerald-600 bg, white text
- Size: 6px 14px padding, full border-radius, DM Sans 500 13px

### Revenue Values
- Font: Geist Mono 600
- Size: 14px in tables, 28px on profile stat cards
- Color: slate-900 (primary text)
- Always include `/mo` suffix for MRR values

### Growth Indicators
- Up: `#059669` (emerald) + up arrow character
- Down: `#DC2626` (red) + down arrow character
- None/null: `#94A3B8` (slate-400) + em dash
- Font: Geist Mono 500 13px

### OG Social Card
- Background: white, no border, subtle shadow (`0 1px 3px rgba(0,0,0,0.08)`)
- Dimensions: 1200x630px (rendered), displayed as 600x315px
- Layout: rank badge (top-left), brand (top-right), name + handle (middle), MRR + growth (bottom)
- Rank badge: amber-50 bg, amber border, Satoshi 900
- Revenue: Geist Mono 600 24px
- Growth: Geist Mono 600, emerald color
- Brand text: Satoshi 700 13px, uppercase, slate-400

### Rising Stars Cards
- Background: white, 1px amber-100 border
- Hover: amber-400 border, subtle amber shadow
- Container: amber-50 gradient background section
- Label: Satoshi 700, amber-700, with flame icon

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-22 | Initial design system created | Created by /design-consultation based on competitive research of TrustMRR, IndieHackers, and indie SaaS space |
| 2026-03-22 | Satoshi as display font | Distinctive in the space — nobody else uses it. Warm but authoritative. |
| 2026-03-22 | Emerald + Amber palette | "Wealth" palette connecting growth (emerald) and achievement (amber). No competitor uses this combo. |
| 2026-03-22 | Geist Mono for revenue figures | Monospace dollar amounts feel precise and financial. Bloomberg-esque confidence. |
| 2026-03-22 | Light clean OG card (no borders) | User preference for consistency with the site's light, clean aesthetic. White card with subtle shadow. |
| 2026-03-22 | No dark mode | User preference — explicitly skipped. |
