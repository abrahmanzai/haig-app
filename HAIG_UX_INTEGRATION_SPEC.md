# HAIG App — UX Enhancement Integration Spec

**Target repo:** `github.com/abrahmanzai/haig-app`  
**Stack:** Next.js 14 (App Router) · Supabase · Tailwind CSS 3 · TypeScript · DM Sans + JetBrains Mono  
**Deploy:** Vercel (`haig.vercel.app`)  
**Date:** 2026-03-30

---

## Purpose

This spec defines where and how to integrate three design tools into the HAIG (High Agency Investment Group) web app to elevate its UI/UX from functional to polished and production-grade. The tools are:

1. **Google Stitch** — AI design canvas that generates high-fidelity UI mockups from text prompts and exports production-ready HTML/CSS/React. Use for prototyping new page layouts and extracting/syncing the design system.
2. **21st.dev Magic** — MCP server that generates modern UI components from natural-language descriptions directly into your project. Use for replacing hand-rolled components with polished, accessible alternatives.
3. **UI UX Pro Max** — Claude Code skill providing a searchable database of 1,500+ design resources: 50+ styles, 97 color palettes, 50 font pairings, 99 UX guidelines, and stack-specific best practices. Use for auditing existing design decisions and informing improvements.

---

## Tool Setup

### Google Stitch MCP

```json
// .mcp.json or Claude Code MCP config
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["-y", "@_davideast/stitch-mcp", "proxy"],
      "env": {
        "STITCH_API_KEY": "<your-stitch-api-key>"
      }
    }
  }
}
```

**Prerequisites:**
- Google Cloud project with billing enabled
- Stitch API enabled: `gcloud beta services mcp enable stitch.googleapis.com --project=<PROJECT_ID>`
- API key from stitch.withgoogle.com → Settings → API Key

**Key Stitch MCP tools:**
- `build_site` — generates design HTML for each screen mapped to a route
- `get_screen_code` — retrieves HTML code for a specific screen
- `get_screen_image` — screenshot of a screen as base64
- Extract "Design DNA" (fonts, colors, layouts) from existing screens

### 21st.dev Magic MCP

```json
{
  "mcpServers": {
    "@21st-dev/magic": {
      "command": "npx",
      "args": ["-y", "@21st-dev/magic@latest", "API_KEY=\"<your-api-key>\""]
    }
  }
}
```

**Prerequisites:**
- API key from 21st.dev/magic console
- Node.js LTS

**Key Magic tools:**
- Generate UI components from natural-language descriptions (e.g. `/ui create a modern data table with sorting and filtering`)
- Components auto-placed into your project following existing code style
- Full TypeScript support, customizable after generation
- SVGL integration for brand logos

### UI UX Pro Max (Claude Code Skill)

```bash
mkdir -p .claude/skills/ui-ux-pro-max && \
curl -L -o skill.zip "https://mcp.directory/api/skills/download/191" && \
unzip -o skill.zip -d .claude/skills/ui-ux-pro-max && rm skill.zip
```

**Usage pattern:**
```bash
# Search by domain
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "glassmorphism dark mode" --domain style
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "investment dashboard" --domain product
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "font pairing DM Sans" --domain typography
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "accessibility contrast" --domain ux
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "responsive layout" --stack nextjs
```

**Domains:** style, color, typography, product, ux, chart, component, icon  
**Stacks:** nextjs, react, html-tailwind, shadcn-ui

---

## Current Architecture Reference

### File structure
```
haig-app/
├── app/
│   ├── _components/          # Shared client components
│   │   ├── AppNav.tsx        # Main navigation (162 lines, client)
│   │   ├── ThemeToggle.tsx   # Dark/light toggle
│   │   ├── ThemeLogo.tsx     # Theme-aware logo
│   │   ├── SplashGate.tsx    # Splash screen gate
│   │   ├── SplashScreen.tsx  # Animated intro
│   │   ├── SignOutButton.tsx
│   │   └── UnreadBadge.tsx   # Messages badge (realtime)
│   ├── page.tsx              # Public landing page (535 lines, server)
│   ├── layout.tsx            # Root layout (DM Sans + JetBrains Mono)
│   ├── globals.css           # Full design token system (280 lines)
│   ├── login/page.tsx        # Auth login (119 lines, client)
│   ├── signup/page.tsx       # Registration
│   ├── dashboard/page.tsx    # Member dashboard (295 lines, server)
│   ├── calendar/
│   │   ├── page.tsx          # Server wrapper
│   │   └── CalendarClient.tsx # Full calendar UI (39KB, client)
│   ├── pitches/
│   │   ├── page.tsx          # Pitch list with status filters (253 lines, server)
│   │   ├── new/
│   │   │   ├── page.tsx      # Server wrapper
│   │   │   └── NewPitchForm.tsx # Pitch form with stock search (441 lines, client)
│   │   └── [id]/
│   │       ├── page.tsx      # Pitch detail (server)
│   │       ├── VotePanel.tsx # Weighted voting UI (286 lines, client)
│   │       ├── PitchComments.tsx
│   │       └── StatusChanger.tsx
│   ├── portfolio/
│   │   ├── page.tsx          # Holdings + trades + live Finnhub prices (301 lines, server)
│   │   └── PortfolioAdminControls.tsx
│   ├── messages/
│   │   ├── page.tsx          # Server wrapper
│   │   ├── MessagesClient.tsx # Tab container
│   │   ├── AnnouncementsTab.tsx
│   │   ├── DirectMessagesTab.tsx
│   │   └── GroupChatTab.tsx
│   ├── research/
│   │   ├── page.tsx
│   │   └── ResearchClient.tsx # AI-powered stock research (23KB)
│   ├── admin/
│   │   ├── page.tsx          # Server wrapper
│   │   └── AdminClient.tsx   # Full admin panel (62KB, client)
│   └── info/                 # Club info/docs page
├── lib/
│   ├── supabase/             # Server + client Supabase helpers
│   ├── date.ts               # Date formatting
│   └── voting.ts             # Vote calculation logic
├── supabase/migrations/      # 6 migration files
├── middleware.ts              # Auth middleware
└── public/
    ├── haig-logo.svg
    ├── logo-mark.svg         # Light watermark (617KB SVG)
    ├── logo-mark-dark.svg    # Dark watermark (545KB SVG)
    └── docs/                 # Static documents
```

### Design token system (globals.css)

The app uses CSS custom properties for full dark/light theming:

**Dark mode (default `:root`):**
- Backgrounds: `--bg-primary: #000`, `--bg-secondary: #1c1c1e`, `--bg-tertiary: #2c2c2e`, `--bg-glass: rgba(44,44,46,0.72)`
- Text: `--text-primary: #fff`, `--text-secondary: #aeaeb2`, `--text-tertiary: #7c7c80`
- Accents: `--accent-primary: #0a84ff`, `--accent-green: #30d158`, `--accent-red: #ff453a`, `--accent-orange: #ff9f0a`, `--accent-purple: #bf5af2`, `--accent-teal: #64d2ff`, `--accent-gold: #ffd60a`
- Borders: `--border: rgba(255,255,255,0.12)`, `--border-hover: rgba(255,255,255,0.22)`
- Glass: `--bg-glass` + `backdrop-filter: blur(20px)`

**Light mode (`html[data-theme="light"]`):**
- All tokens swap (e.g. `--bg-primary: #fff`, `--accent-primary: #007AFF`)

**Reusable CSS classes:**
- `.stat-card` — bg-secondary, border, 16px radius, 20px padding, hover border
- `.glass-card` — bg-glass, backdrop-filter, same border + radius
- `.num` — tabular-nums for financial figures
- `.messages-container` — dvh-aware height calc

### Data model (Supabase)
```
profiles (id, full_name, email, role[member|authorized|admin], capital_contribution, voting_units, joined_at, avatar_url)
events (id, title, description, event_type[founding|meeting|workshop|speaker|social|deadline|review], event_date, event_time, location, created_by)
pitches (id, submitted_by→profiles, company_name, ticker, pitch_type[buy|sell|hold], thesis, financials, risks, price_target, current_price, vote_threshold, status[pending|voting|approved|rejected|closed])
votes (id, pitch_id→pitches, voter_id→profiles, vote[yes|no|abstain], voting_units_cast)
holdings (id, company_name, ticker, shares, avg_cost_basis, current_price)
trades (id, company_name, ticker, trade_type[buy|sell], shares, price_per_share, trade_date, suggested_by→profiles, pitch_id→pitches, notes)
attendance (id, event_id→events, member_id→profiles, present)
club_financials (id=1, cash_on_hand, total_invested)
```

### Role-based access
- `member` — can view dashboard, calendar, pitches (read-only), portfolio
- `authorized` — above + pitch submission, voting, messages, research, info
- `admin` — above + admin panel, status changes, member management, portfolio controls

---

## Integration Plan

Execute phases in order. Each phase uses the tools in sequence: **UI UX Pro Max** (audit/research) → **Google Stitch** (prototype) → **21st.dev** (generate components).

---

### Phase 0: Design System Extraction & Audit

**Goal:** Create a `DESIGN.md` at the repo root that serves as the single source of truth for all subsequent work.

**Step 0.1 — UI UX Pro Max: Audit current design**
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "glassmorphism dark mode investment" --domain style
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "DM Sans" --domain typography
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "blue green finance trust" --domain color
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "accessibility contrast ratio" --domain ux
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "dashboard investment fintech" --domain product
```

**Capture recommendations for:**
- Whether DM Sans is optimal or if a font swap/pairing would elevate the brand
- Whether the iOS-derived accent palette (#0a84ff, #30d158) conveys enough "financial trust" or needs a deeper/warmer variant
- Glassmorphism opacity values: is `rgba(44,44,46,0.72)` providing sufficient text contrast?
- Any WCAG issues in the current light-mode text tokens

**Step 0.2 — Google Stitch: Extract Design DNA**

Point Stitch at the deployed site (`haig.vercel.app`) or the codebase. Use the extract-design-context tool to pull:
- Color palette (map to existing CSS variables)
- Typography scale (currently: DM Sans body + JetBrains Mono code)
- Spacing system (currently ad-hoc: px values in Tailwind classes)
- Component patterns (stat-card, glass-card, nav bar, badge system)

**Step 0.3 — Write DESIGN.md**

Create `DESIGN.md` in the repo root synthesizing the Stitch extraction + UX Pro Max recommendations. Structure:

```markdown
# HAIG Design System

## Brand
- Name: High Agency Investment Group
- Tagline: Learn. Invest. Build.
- Aesthetic: Dark-first glassmorphism with iOS-inspired accent colors

## Colors
[Extracted palette with CSS variable names]
[Any UX Pro Max recommendations for changes]

## Typography
- Primary: DM Sans (body, UI)
- Mono: JetBrains Mono (financial figures, code)
- [Recommended display font for landing page headlines, if any]

## Spacing
- Card padding: 20px
- Section padding: 96px vertical, 24px horizontal
- Card border-radius: 16px
- Button border-radius: 12px

## Components
- stat-card: [token reference]
- glass-card: [token reference]
- Badge system: [color + opacity mapping]

## Interaction
- Border hover: 0.12 → 0.22 opacity
- Button hover: brightness(1.1)
- Glass blur: 20px
```

This file becomes context for every subsequent Stitch and 21st.dev generation.

---

### Phase 1: Shared Component Layer (`app/_components/`)

**Priority: HIGH** — These components appear on every authenticated page.

#### 1.1 AppNav Redesign

**Current state:** `AppNav.tsx` (162 lines) — hand-rolled responsive nav with mobile hamburger drawer, role-based link filtering, unread badge for messages, theme toggle, sign-out button.

**UI UX Pro Max:**
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "navigation bar responsive" --domain component
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "mobile drawer navigation" --domain ux
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "navbar sidebar" --stack nextjs
```

**21st.dev Magic prompt:**
```
/ui Create a responsive navigation bar for a Next.js financial application. 
Requirements:
- Sticky top, glass-card background with backdrop-filter blur(20px)
- Left: logo (36x36 img), then horizontal nav links (Dashboard, Calendar, Pitches, Portfolio, Research, Messages, Info, Admin)
- Links should be conditionally visible based on a `role` prop ("member", "authorized", "admin")
- Active link has bg-tertiary background with text-primary color
- Messages link has an unread count badge (red dot)
- Admin link styled with gold accent color
- Right: user name text, theme toggle button, sign-out button
- Mobile (<640px): collapse links into hamburger menu with slide-down drawer
- All colors use CSS custom properties: --bg-nav, --border, --text-primary, --text-secondary, --text-tertiary, --bg-tertiary, --accent-primary, --accent-gold
- TypeScript, "use client" directive, accepts props: { name?: string; role?: string; currentPath: string }
```

**Preserve:** The existing UnreadBadge component uses Supabase realtime subscriptions — keep that integration.

#### 1.2 ThemeToggle Enhancement

**Current state:** Basic toggle between `data-theme="light"` and default dark. Stores preference in `localStorage('haig_theme')`.

**21st.dev Magic prompt:**
```
/ui Create an animated dark/light theme toggle button.
- Smooth icon transition between sun and moon (not just swap)
- Small (32x32px), subtle animation
- Uses lucide-react icons
- On click: toggles html[data-theme] between unset and "light"
- Persists to localStorage key "haig_theme"
- "use client" component
```

#### 1.3 SplashScreen Polish

**Current state:** Multi-phase CSS animation: logo fades in → text staggers in → everything dissolves, revealing the landing page hero. Well-engineered but could use smoother easing.

**Action:** Keep the existing implementation but use UI UX Pro Max to check animation best practices:
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "splash screen animation loading" --domain ux
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "animation easing curves" --domain ux
```

Apply any recommended easing or timing adjustments to `globals.css` splash classes.

---

### Phase 2: Landing Page (`app/page.tsx`)

**Current state:** 535-line server component with sections: Nav → Hero → Features (3 cards) → Events (Supabase query) → How It Works (4 step cards) → Founding Partners (4 slots) → Contact.

**Priority: HIGH** — This is the first thing visitors see.

#### 2.1 Hero Section Redesign

**UI UX Pro Max:**
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "hero section landing page" --domain style
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "call to action conversion" --domain ux
```

**Google Stitch:** Create a Stitch project called "HAIG Landing" and prototype 3-5 hero variants. Key requirements:
- Keep the "High Agency Investment Group" headline with gradient "Learn. Invest. Build." tagline
- Add more visual depth beyond the current radial glow (the current `radial-gradient(circle, rgba(10,132,255,0.10) 0%, transparent 65%)` is too subtle)
- Improve the CTA hierarchy: "Get in Touch" is primary, "Member Login" is secondary
- Ensure responsive behavior from mobile to desktop
- Reference DESIGN.md for token consistency

Export the winning design's HTML and adapt into the existing server component.

#### 2.2 Feature Cards

**Current:** 3 static cards (Learn, Invest, Build) with lucide icons and colored accents.

**21st.dev Magic prompt:**
```
/ui Create a feature card grid component for a landing page.
- 3 cards in a responsive grid (1 col mobile, 3 col desktop)
- Each card has: icon (lucide-react component), title, body text, accent color
- Glass-card styling: bg-glass background, backdrop-filter blur(20px), 1px border, 16px radius
- Subtle hover animation: slight scale + border color change
- Cards accept props: { icon: LucideIcon; title: string; body: string; color: string }
- Color accent on the icon background
- Dark/light theme via CSS variables
```

#### 2.3 Events Section

**Current:** Fetches upcoming events from Supabase, renders as a card list with colored dots by event_type.

**Enhancement:** Add a mini-calendar preview alongside the list for visual richness.

**Google Stitch:** Prototype a split layout: left side = compact month grid with event dots, right side = upcoming event list. Export layout.

#### 2.4 How It Works + Founders

These sections are solid. Minor polish only:
- **How It Works:** Add subtle scroll-triggered entrance animations (CSS `@keyframes` with `IntersectionObserver`)
- **Founders:** If avatar_url is added to profiles later, the cards should support photo avatars with fallback to the current initial badges

---

### Phase 3: Authentication (`app/login/`, `app/signup/`)

**Priority: MEDIUM** — Functional but minimal.

#### 3.1 Login Page

**Current state:** Glass card with raw `<input>` elements, inline focus/blur style handlers, basic error display.

**UI UX Pro Max:**
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "login form authentication" --domain component
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "form input field states" --domain ux
```

**21st.dev Magic prompt:**
```
/ui Create a login form component for a Next.js application.
- Glass-card container: max-w-sm, rounded-2xl, glass background with backdrop blur
- "HAIG" header text + "Sign in to your account" subtitle
- Email input with proper styling and focus ring animation (accent-primary color)
- Password input with show/hide toggle button
- Error message display with red accent background
- Submit button: full-width, accent-primary background, loading spinner state
- "Need an account? Sign Up" link below
- All colors via CSS custom properties
- "use client", Supabase auth via signInWithPassword
- Uses useRouter for redirect to /dashboard on success
```

#### 3.2 Signup Page

Same treatment as login. Add:
- Full name field
- Password strength indicator
- Email format validation with visual feedback
- Terms acceptance checkbox (link to partnership agreement)

---

### Phase 4: Dashboard (`app/dashboard/page.tsx`)

**Priority: HIGH** — The primary authenticated experience.

**Current state:** 295-line server component with: welcome header + role badge → pending-access banner (member only) → 4 stat cards (Capital, Voting Units, Active Votes, Next Event) → portfolio snapshot + upcoming events (2-col) → quick-nav tiles.

#### 4.1 Stat Cards Enhancement

**UI UX Pro Max:**
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "dashboard stat card KPI" --domain component
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "data visualization dashboard" --domain chart
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "dashboard fintech investment" --domain product
```

**21st.dev Magic prompt:**
```
/ui Create a stat card component for a financial dashboard.
- Props: { label: string; value: string; subtitle: string; accentColor: string; trend?: "up" | "down" | "neutral" }
- Colored top border accent (2px solid, 33% opacity)
- Label: uppercase, tracking-wider, text-tertiary
- Value: large bold text, accent color, tabular-nums
- Subtitle: small text-tertiary
- Optional trend indicator arrow (small up/down chevron with green/red color)
- stat-card base: bg-secondary, 1px border, 16px radius, hover border change
- Dark/light via CSS variables
```

#### 4.2 Portfolio Snapshot

**Current:** Simple 3-line summary (Total Value, Invested, Cash on Hand).

**Enhancement:** Add a tiny donut chart showing the cash vs invested allocation. Use Recharts (already in dependencies).

**21st.dev Magic prompt:**
```
/ui Create a portfolio summary card with a small donut chart.
- Left side: 3 rows of label + value (Total Value, Invested, Cash on Hand)
- Right side: small (80x80) donut chart with 2 segments (Invested = accent-primary, Cash = accent-green)
- Values formatted as USD with tabular-nums
- stat-card styling
- Uses Recharts PieChart
```

#### 4.3 Quick-Nav Tiles

**Current:** 4 tiles (Calendar, Pitches, Portfolio, Admin) with colored top accent borders.

**Enhancement:** Add subtle hover animations and consider adding a small icon or badge count to each tile.

---

### Phase 5: Pitches (`app/pitches/`)

**Priority: HIGH** — Core business logic of the app.

#### 5.1 Pitch List Page

**Current state:** Status filter pill tabs + card list. Each card shows: pitch type badge (BUY/SELL/HOLD), ticker, company name, thesis excerpt (2-line clamp), price target, current price, submitter, date, status badge.

**Google Stitch:** Prototype an enhanced pitch list with:
- Kanban-style columns for different statuses (optional toggle vs list view)
- Richer pitch preview cards with a subtle chart sparkline for the stock
- Better visual hierarchy between active/voting pitches and closed ones

#### 5.2 NewPitchForm Redesign

**Current state:** `NewPitchForm.tsx` (441 lines) — single-page form with ticker autocomplete (Finnhub API), company search dropdown, pitch type selector (BUY/SELL/HOLD), threshold selector, text areas for thesis/financials/risks, price inputs with auto-fetch.

**This is the biggest UX improvement opportunity in the app.**

**UI UX Pro Max:**
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "multi step form wizard" --domain component
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "form validation feedback" --domain ux
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "textarea rich input" --domain component
```

**21st.dev Magic prompt:**
```
/ui Create a multi-step investment pitch submission form.

Step 1 — Stock Selection:
- Ticker input with autocomplete dropdown (fetches from /api/stocks/search?q=)
- Company name auto-fills from selection
- Current price auto-fetched and displayed
- Pitch type selector: three toggle buttons (BUY green, SELL red, HOLD orange)

Step 2 — Investment Thesis:
- Large textarea for thesis (required, min 50 chars)
- Textarea for financials (optional)
- Textarea for risks (optional)
- Character count indicators

Step 3 — Price Target & Voting:
- Price target input with $ prefix
- Vote threshold dropdown (Simple majority >50%, Supermajority >66.7%, Supermajority >75%)
- Summary preview of all entered data

Navigation:
- Step indicator pills at top (1 of 3, 2 of 3, 3 of 3)
- Back / Next buttons at bottom
- Final step has "Submit Pitch" button
- Glass-card container, all CSS variables for theming
- "use client", posts to Supabase pitches table
```

**Critical:** Preserve the existing Finnhub stock search autocomplete logic (`fetchSuggestions`, debouncing, keyboard navigation). The 21st.dev component should wrap around the existing data-fetching behavior, not replace it.

#### 5.3 VotePanel Enhancement

**Current state:** `VotePanel.tsx` (286 lines) — shows vote tally (yes/no/abstain weighted units), threshold bar, vote buttons, admin voter breakdown table.

**21st.dev Magic prompt:**
```
/ui Create a voting panel for a weighted-unit voting system.
- Visual progress bar showing yes (green) vs no (red) vs abstain (gray) as proportional segments
- Threshold marker line on the bar (configurable: 50%, 66.7%, or 75%)
- Three vote buttons: Approve (green), Reject (red), Abstain (gray) — disabled if already voted or not authorized
- "Your vote: [choice]" indicator if already voted with option to change
- Total units cast / total eligible display
- Admin view: table of individual votes with voter name and units cast
- Animated bar transitions when votes change
- All CSS variables, glass-card container
```

---

### Phase 6: Portfolio (`app/portfolio/page.tsx`)

**Priority: MEDIUM** — Important but viewed less frequently than dashboard/pitches.

**Current state:** 301-line server component. Overview stat cards (Total Value, Cash, Invested, Gain/Loss) → Holdings table (ticker, shares, avg cost, current price, market value, gain/loss, weight) → Recent trades table → Admin controls (add trade, update financials).

#### 6.1 Holdings Table

**UI UX Pro Max:**
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "data table sortable" --domain component
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "portfolio holdings table" --domain product
```

**21st.dev Magic prompt:**
```
/ui Create a portfolio holdings data table.
- Columns: Ticker, Company, Shares, Avg Cost, Current Price, Market Value, Gain/Loss ($), Gain/Loss (%), Weight (%)
- Gain/Loss colored green (positive) or red (negative)
- Weight column shows a small horizontal bar proportional to portfolio weight
- Sortable column headers (click to sort asc/desc)
- Responsive: horizontal scroll on mobile, sticky ticker column
- Rounded-2xl container with bg-secondary
- Header row has bottom border, alternating row opacity for readability
- All financial numbers use tabular-nums class
- Footer row with totals
```

#### 6.2 Allocation Chart

**New addition.** Add a Recharts-powered allocation pie/donut chart above the holdings table showing percentage breakdown by holding.

**21st.dev Magic prompt:**
```
/ui Create a portfolio allocation donut chart using Recharts.
- Donut chart (PieChart with innerRadius) showing each holding's weight
- Center text: total portfolio value
- Legend below with ticker + percentage
- Color assignment from the existing accent palette
- Responsive, stat-card container
- Accepts data as: { ticker: string; value: number; color: string }[]
```

---

### Phase 7: Calendar (`app/calendar/CalendarClient.tsx`)

**Priority: MEDIUM**

**Current state:** 39KB client component — already feature-rich with month grid, event creation, RSVP, event type filtering.

**Enhancement focus:** Visual polish rather than feature additions.

**UI UX Pro Max:**
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "calendar component grid" --domain component
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "event calendar UX" --domain ux
```

**Actions:**
- Audit event color coding against the EVENT_COLORS map for accessibility (some colors may lack contrast in light mode)
- Add subtle animation to month transitions
- Improve the event creation modal with a 21st.dev generated form component
- Consider adding a mini weekly/agenda view toggle

---

### Phase 8: Messages (`app/messages/`)

**Priority: LOW** — Already functional with 3 tabs (Announcements, Direct Messages, Group Chat).

**UI UX Pro Max:**
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "chat messaging interface" --domain component
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "message bubble layout" --domain ux
```

**Actions:**
- Polish message bubble styling with better sent/received differentiation
- Add typing indicators
- Improve empty state illustrations
- Tab bar scroll snap for mobile

---

### Phase 9: Admin Panel (`app/admin/AdminClient.tsx`)

**Priority: LOW** — Only seen by admins but the largest single file (62KB).

**21st.dev Magic prompt:**
```
/ui Create a data table component for member management.
- Columns: Name, Email, Role (badge), Capital ($), Voting Units, Joined Date, Actions
- Role badges: Admin = gold, Authorized = green, Member = blue
- Actions: dropdown with "Promote to Authorized", "Promote to Admin", "Demote"
- Search/filter bar above the table
- Sortable headers
- Responsive with horizontal scroll
- stat-card container styling
```

---

### Phase 10: Global Polish

#### 10.1 Loading States

**Current:** Each `loading.tsx` is a simple skeleton. Replace with shimmer animations.

**21st.dev Magic prompt:**
```
/ui Create a shimmer loading skeleton component.
- Accepts variant prop: "card" | "table" | "list" | "stat"
- Animated gradient shimmer effect (light sweep across gray placeholder)
- Matches the dimensions of the corresponding real component
- Dark/light mode aware via CSS variables
```

#### 10.2 Error Boundary

**Current:** `app/error.tsx` exists but is basic.

**Enhancement:** Add a branded error page with the HAIG logo watermark and helpful retry/navigation actions.

#### 10.3 Scroll Animations

Add `IntersectionObserver`-based entrance animations to the landing page sections. Use CSS `@keyframes` for fade-up effects with staggered delays.

**UI UX Pro Max:**
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "scroll animation intersection observer" --domain ux
```

#### 10.4 Mobile Optimization

**UI UX Pro Max:**
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "mobile responsive design" --domain ux
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "touch targets mobile" --domain ux
```

Audit all pages for:
- Touch target sizes (minimum 44x44px)
- Bottom-of-screen action buttons for mobile (especially on pitch detail + voting)
- Horizontal scroll prevention
- Input zoom prevention (`font-size: 16px` minimum on inputs)

---

## Constraints & Guidelines

1. **Preserve server/client boundary.** Pages using `export const dynamic = "force-dynamic"` are server components doing Supabase queries. Don't convert these to client components. New interactive elements should be separate client components imported into the server page.

2. **Preserve the auth flow.** Every authenticated page checks `supabase.auth.getUser()` and redirects to `/login`. Don't break this pattern.

3. **Preserve the role system.** `member`, `authorized`, `admin` — component visibility is gated by role. All new components must respect this.

4. **Use existing CSS variables.** Never hardcode hex colors. Always reference `var(--accent-primary)`, `var(--bg-glass)`, etc. If new tokens are needed, add them to `globals.css` in both `:root` and `html[data-theme="light"]`.

5. **Preserve Supabase data layer.** All data fetching goes through `@/lib/supabase/server` or `@/lib/supabase/client`. No new API routes unless necessary.

6. **Keep dependencies minimal.** Currently: `next`, `react`, `@supabase/ssr`, `@supabase/supabase-js`, `lucide-react`, `recharts`, `resend`. Only add new deps if a 21st.dev component requires them (e.g. `framer-motion` for animations). Prefer CSS-only solutions.

7. **TypeScript strict.** All new components must be fully typed.

8. **Naming convention.** Components: PascalCase. Files: match component name. Client components: `"use client"` at top.

9. **File size awareness.** Some files are already large (CalendarClient 39KB, AdminClient 62KB). New enhancements should extract into smaller sub-components rather than adding to these monoliths.

10. **Test on both themes.** Every visual change must work in both dark mode (default) and light mode. Toggle with the ThemeToggle component or `localStorage.setItem('haig_theme', 'light')`.

---

## Success Criteria

- [ ] `DESIGN.md` exists at repo root with full design system documentation
- [ ] AppNav is polished with smooth mobile drawer animation
- [ ] Login/signup forms have input validation visual feedback and password visibility toggle
- [ ] Landing page hero has more visual depth and better CTA hierarchy
- [ ] NewPitchForm is a multi-step wizard with progress indicator
- [ ] VotePanel has animated progress bar with threshold marker
- [ ] Portfolio has allocation donut chart and enhanced holdings table
- [ ] All stat cards have consistent styling with optional trend indicators
- [ ] Loading skeletons use shimmer animation
- [ ] Landing page sections have scroll-triggered entrance animations
- [ ] All changes pass WCAG AA contrast in both themes
- [ ] No regressions in auth flow, role gating, or Supabase data fetching
