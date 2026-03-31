# HAIG Design System

> **Source of truth** for all UI/UX decisions in the haig-app codebase.  
> Synthesized from UI UX Pro Max audit + existing `globals.css` design tokens.  
> Date: 2026-03-30

---

## Brand

- **Name:** High Agency Investment Group (HAIG Capital)
- **Tagline:** Learn. Invest. Build.
- **Aesthetic:** Dark-first glassmorphism with financial trust palette
- **Style:** Premium fintech — think Linear + Stripe + Apple Finance, not a retail brokerage

---

## Colors

All colors are CSS custom properties defined in `app/globals.css`. **Never hardcode hex values.**

### Dark Mode (default `:root`)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-primary` | `#050506` | Page background |
| `--bg-secondary` | `#0f0f11` | Cards, sidebar |
| `--bg-tertiary` | `rgba(255,255,255,0.08)` | Input fills, hover states |
| `--bg-glass` | `rgba(255,255,255,0.04)` | Glass card backgrounds |
| `--bg-nav` | `rgba(15,15,17,0.92)` | Nav/header with backdrop blur |
| `--text-primary` | `#EDEDEF` | Headlines, key values |
| `--text-secondary` | `#8A8F98` | Supporting text (~5.4:1 on bg-secondary) |
| `--text-tertiary` | `#6B7280` | Labels, metadata |
| `--accent-primary` | `#5E6AD2` | Primary brand accent (indigo) |
| `--accent-green` | `#30d158` | Positive, buy, approve |
| `--accent-red` | `#ff453a` | Negative, sell, reject |
| `--accent-orange` | `#ff9f0a` | Hold, warning |
| `--accent-purple` | `#bf5af2` | Speaker events, misc |
| `--accent-teal` | `#64d2ff` | Review events, info |
| `--accent-gold` | `#ffd60a` | Admin role, founding events |
| `--border` | `rgba(255,255,255,0.08)` | Default borders |
| `--border-hover` | `rgba(255,255,255,0.16)` | Hovered borders |

### Light Mode (`html[data-theme="light"]`)

| Token | Value | Notes |
|-------|-------|-------|
| `--accent-primary` | `#4f59b8` | Darkened for 4.5:1+ on white |
| `--accent-green` | `#28a745` | WCAG AA pass |
| `--accent-red` | `#dc3545` | WCAG AA pass |
| `--text-primary` | `#1d1d1f` | ~17:1 on white |
| `--text-secondary` | `#6e6e73` | ~5.4:1 on white |
| `--text-tertiary` | `#86868b` | 4.5:1 — AA pass |

### UI UX Pro Max Audit Notes
- ✅ IBM Plex Sans confirmed as optimal fintech typeface (trustworthy, corporate, banking)
- ✅ Glassmorphism is appropriate for financial dashboards — ensure 4.5:1 text contrast
- ✅ Dark bg + green positive indicators matches the recommended fintech palette
- ⚠️ Light mode glass cards must use higher opacity (`bg-white/80` minimum) — `rgba(255,255,255,0.04)` is too transparent in light mode; `--bg-glass` token overrides this in `html[data-theme="light"]` to `rgba(255,255,255,0.92)`
- ⚠️ Ensure no emojis used as UI icons (✓ project uses lucide-react throughout)

---

## Typography

| Role | Font | Weight | Size |
|------|------|--------|------|
| Body / UI | IBM Plex Sans | 400, 500, 600, 700 | 14–16px |
| Monospace / Figures | JetBrains Mono (via `.geist-mono`) | 400, 700 | 12–14px |
| Page titles | IBM Plex Sans | 700 | 24–36px |
| Stat values | IBM Plex Sans + `.geist-mono` | 700 | 22–28px |

**Rules:**
- All financial figures use `.geist-mono` (tabular-nums)
- Body text minimum 16px on mobile (prevents iOS input zoom)
- Line height 1.5–1.75 for body paragraphs
- Labels: `text-[10px] uppercase tracking-widest` (small caps pattern)

---

## Spacing

| Token | Value |
|-------|-------|
| Card padding | 20px (`.stat-card`) |
| Card padding large | 24px (`.glass-card` large) |
| Section padding V | 32px (`py-8`) |
| Section padding H | 24px (`px-6`) |
| Card border-radius | 16px (`rounded-2xl`) |
| Button border-radius | 12px (`rounded-xl`) |
| Input border-radius | 12px (`rounded-xl`) |
| Gap between cards | 16px (`gap-4`) |

---

## Components

### `.stat-card`
- `background: var(--bg-glass)` + `border: 1px solid var(--border)`
- `border-radius: 16px` + `padding: 20px`
- `transition: border-color 0.2s` on hover → `var(--border-hover)`
- Top accent stripe: `2px solid <color>33` (20% opacity)
- Ghost icon: `size={40}`, `absolute right-3 bottom-3`, `opacity: 0.05`

### `.glass-card`
- Same as `.stat-card` + `backdrop-filter: blur(20px)`

### Badge system
- Role badges: `<color>20` background + full-opacity text
- Status badges: `rounded-full px-3 py-1.5`, same pattern
- Event type: `<color>18` background (6% opacity)

### Buttons
- **Primary:** `background: var(--accent-primary)`, white text, `hover:brightness(1.1)`
- **Secondary/Ghost:** transparent + `border: var(--border)`, `hover: var(--bg-tertiary)`
- **Destructive:** `background: rgba(255,69,58,0.12)`, `color: var(--accent-red)`
- All buttons: `disabled:opacity-50`, `transition-all`

### Inputs
- `border: 1px solid var(--border)` → `var(--accent-primary)` on focus
- `background: var(--bg-tertiary)` (dark) / `var(--input-bg)` (light)
- `min font-size: 16px` (prevents iOS zoom)
- Always paired with a `<label>` for accessibility

---

## Interaction Patterns

| Pattern | Value |
|---------|-------|
| Border hover opacity | 0.08 → 0.16 |
| Button hover | `brightness(1.1)` |
| Glass blur | 20px |
| Micro-animation duration | 150–300ms |
| Page transition | `ease-out` |
| Entrance animation | `fadeUp` — `translateY(16px)` → `0`, `opacity 0→1` |
| Shimmer sweep | 1.5s linear infinite |

---

## Animation

```css
/* Entrance — fade up (scroll reveal) */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Shimmer — skeleton loading */
@keyframes shimmer {
  from { background-position: -200% 0; }
  to   { background-position:  200% 0; }
}
```

**Rules (from UI UX Pro Max):**
- Use `transform` and `opacity` only — never animate `width`, `height`, or `top/left`
- Always add `@media (prefers-reduced-motion: reduce)` overrides
- 150–300ms for micro-interactions, 400–600ms for page-level transitions

---

## Accessibility

- WCAG AA minimum 4.5:1 contrast for normal text (all tokens verified)
- Visible focus rings: `focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`
- All icon-only buttons: `aria-label` required
- All form inputs: paired `<label>` with `htmlFor`
- Touch targets: minimum 44×44px
- Color is never the sole differentiator (always add text labels alongside color badges)

---

## Role Color Mapping

| Role | Color |
|------|-------|
| `admin` | `--accent-gold` (`#ffd60a`) |
| `authorized` | `--accent-green` (`#30d158`) |
| `member` | `--accent-primary` (`#5E6AD2`) |

---

## Event Type Color Mapping

| Event | Color |
|-------|-------|
| `founding` | `#ffd60a` |
| `meeting` | `#5E6AD2` |
| `workshop` | `#30d158` |
| `speaker` | `#bf5af2` |
| `social` | `#ff9f0a` |
| `deadline` | `#ff453a` |
| `review` | `#64d2ff` |

---

## File Structure Reference

```
app/
├── globals.css          ← Design tokens (this document's source of truth)
├── _components/
│   ├── AppNav.tsx       ← Collapsible sidebar + mobile drawer
│   ├── ThemeToggle.tsx  ← Dark/light toggle (localStorage: "haig_theme")
│   └── ...
├── page.tsx             ← Public landing page
├── dashboard/           ← Member dashboard (stat cards, portfolio snapshot)
├── pitches/             ← Pitch list, new pitch form (multi-step), vote panel
├── portfolio/           ← Holdings table, allocation chart
└── ...
```
