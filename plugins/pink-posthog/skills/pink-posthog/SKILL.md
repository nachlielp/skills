---
name: pink-posthog
description: Use this skill whenever the user wants an app, page, report, or demo styled — and either names this look or leaves the design up to you. It is the "pink PostHog" house design system: pink paper background, extrabold Archivo headings, white cards with hard offset shadows, chunky 3D press-down buttons, a selectable accent (sky, teal, violet, berry, or classic orange — always ask which), and paper/ink/brand design tokens (including the Tailwind v4 @theme setup). Trigger on any mention of its ingredients — pink theme, pink paper, Archivo, chunky/3D buttons, PostHog-style, "my usual style", paper/ink/brand tokens — even offhand. Also trigger when the user asks for a new UI, landing page, dashboard, admin app, demo, or self-contained HTML report that should "look good" or "polished" without giving their own brand or design direction: this is the default style then. Do not use for PostHog the analytics product, for debugging existing CSS/Tailwind, or when the user specifies a different design system or brand.
---

# Pink PostHog design system

PostHog.com's design language re-hued onto pink paper. The look: warm pink
paper background, near-black ink text, a strong single accent color,
chunky extrabold headings, white cards with thin pink borders and hard offset
shadows, and "3D" buttons that physically depress when clicked. Playful but
disciplined — the fun comes from weight, color, and physics, never from
gradients, blurs, or rounded-full pills.

## Accent — ask the user first

The accent (`brand` / `brand-dark` / `tint`) is a per-project choice, not a
fixed token. **Before building anything new with this skill, prompt the user
to pick one with the AskUserQuestion tool** — one question, header "Accent",
these four options, phrasing the question so "Other" covers classic orange or
any custom color (e.g. "Which accent color? Pick one, or choose Other for the
classic PostHog orange / a custom color."):

| Accent     | `brand`   | `brand-dark` | `tint`    | Character                          |
| ---------- | --------- | ------------ | --------- | ---------------------------------- |
| **Sky**    | `#0369a1` | `#075985`    | `#e0f2fe` | Light-blue range; crisp, airy      |
| **Teal**   | `#0f766e` | `#134e4a`    | `#ccfbf1` | Pink's complement; fresh, retro    |
| **Violet** | `#7c3aed` | `#5b21b6`    | `#ede9fe` | Analogous; calm, premium SaaS      |
| **Berry**  | `#be185d` | `#9d174d`    | `#fce7f3` | Monochrome pink; boldest brand     |

Classic orange (the original) is `brand #f54e00` / `brand-dark #b23800` /
`tint #fde8de`. Live side-by-side previews of all options:
https://pages.nachli.com/p/fhnWvMH1LqbW

Skip the prompt only when the user already named an accent in the
conversation, or when iterating on an existing artifact — then keep whatever
accent it already uses.

Notes that apply to every accent:

- All five pass WCAG AA for white-on-`brand` buttons and `brand` links on
  paper/white at the system's 13px/700 UI weights.
- `tint` is for fills that mean *selected/active* — active nav items, chips,
  badges, selected rows. Plain hovers stay `paper-dark`.
- Sky has extra ambient steps if needed: `#bae6fd` (hover), `#7dd3fc`
  (decor), `#38bdf8` (large icons only — too light for text).
- Berry sits near `danger #b91c1c`; give destructive actions clear
  iconography so they stay unmistakable.

## Tokens

Use these exact values. Every color in the UI should come from this table —
if you need a new shade, derive it from these rather than inventing one.

| Token         | Value     | Role                                              |
| ------------- | --------- | ------------------------------------------------- |
| `paper`       | `#faedf0` | Page background (never pure white pages)          |
| `paper-dark`  | `#f2dbe1` | Hover tints, selected rows, inline-code bg, chips |
| `ink`         | `#151515` | Text, headings; dark toast/overlay base           |
| `muted`       | `#6f5b61` | Secondary text (pink-tinted gray, not pure gray)  |
| `line`        | `#e4c8cf` | Borders — always 1.5px                            |
| `line-strong` | `#c9a0ab` | Border/edge of secondary buttons, dashed borders  |
| `brand`       | *per accent* | Accent: primary buttons, links, active icons — see table above |
| `brand-dark`  | *per accent* | Primary button edge (border + hard shadow)     |
| `tint`        | *per accent* | Selected/active fills: active nav, chips, selected rows |
| `success`     | `#2f9110` | Success buttons/confirmation (edge `#1e6309`)     |
| `success-tint`| `#e7f4e0` | Success *fills* — banners, "done" badges/rows     |
| `danger`      | `#b91c1c` | Destructive actions (edge `#7f1d1d`)              |
| `danger-tint` | `#fee2e2` | Danger *fills* — error banners, ghost-danger hover |
| Code blocks   | `#1d1f27` | Dark editor panel, text `#e8eaf0`                 |

Semantic states use their **own** tint, never the accent `tint`: a success
badge is `success` text/border on `success-tint`, not green-on-pink. Reserve
`tint` (the accent hue) for *selected/active* affordances only.

## Fonts

- **Archivo** for everything (it's the free stand-in for PostHog's Matter):
  body 400–600, UI controls 700, headings 800 with `letter-spacing: -0.02em`.
- **Source Code Pro** for code.
- Load from Google Fonts:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400..900;1,400..900&family=Source+Code+Pro:wght@400..700&display=swap" rel="stylesheet" />
```

If the page must be fully self-contained (no external requests), fall back to
the system stack — the system's heaviest weights keep most of the character.

Critical font rule: Archivo at weight 400 reads like a generic system font.
UI chrome (nav items, sidebar rows, table cells that identify things, labels)
should be **600+**; only long-form body copy stays at 400.

## Components

The exact CSS lives in [assets/pink-posthog.css](assets/pink-posthog.css) —
copy it into the project (or translate it into the project's styling system)
rather than re-deriving it. For Tailwind v4 projects, read
[references/tailwind-v4.md](references/tailwind-v4.md) instead; it has the
same system as an `@theme` block + component layer.

**For React + Tailwind v4 projects, prefer the ready-made component library**
in [assets/react/](assets/react/) — a shadcn-style set (Radix primitives +
`cva`) already themed to this system: Button, Card, Input, Textarea, Label,
Badge, Callout, Kicker, Dialog/Modal, Popover, Select, DropdownMenu, Tabs,
Switch, Checkbox, Slider, Tooltip, Table, Calendar, DatePicker (with a
slider-based time popover), plus `ToastProvider`/`useToast` and
`ConfirmProvider`/`useConfirm`. Copy it in and set the accent in its
`theme.css`. Setup, dependency list, and provider wiring are in
[references/react-components.md](references/react-components.md). The plain-CSS
`.btn`/`.card`/etc. below still describe what every component renders:

- **`.btn`** — the signature 3D button: fixed height 34px (`2.125rem`),
  13px/700 text, 6px radius, 1.5px border in the edge color plus
  `box-shadow: 0 2px 0 <edge>`; on `:active` it translates down 2px and drops
  the shadow, so it visibly presses into the page. Variants only change
  colors: `btn-primary` (brand/brand-dark), `btn-secondary` (white/
  line-strong), `btn-danger`, `btn-success`.
- **`.btn-ghost`** — borderless sibling with identical height and type, for
  table row actions and low-emphasis controls; hovers to a `paper-dark` pill.
- **`.card`** — white, 1.5px `line` border, 8px radius,
  `box-shadow: 0 2px 0 rgba(0,0,0,.06)`. Shadows in this system are always
  hard offsets (0 blur) — a blur is off-brand.
- **`.input`** — white, 1.5px `line` border, 6px radius, same 34px height as
  buttons so paired input+button rows align; focus turns the border `brand`
  (no glow rings). The 6px radius is the *same* as `.btn` on purpose — inputs
  read as square-cornered controls that match the buttons beside them. Never
  make an input (search fields included) a pill or fully rounded; that breaks
  the button/input pairing.
- **`.kicker`** — 11px/800 uppercase label with `letter-spacing: .12em`, used
  above headings and as table headers / sidebar section titles. Usually
  `brand` above hero headings, `muted` in chrome. (Don't name a CSS class
  `overline` — it collides with Tailwind's text-decoration utility.)
- **`<select>`** — style the closed control like `.input`. To also theme the
  *open* dropdown (native lists can't be styled), opt into the customizable
  `<select>` and style `::picker(select)` as a `.card`-like popup. It's fiddly
  and has real gotchas — read
  [references/select-dropdown.md](references/select-dropdown.md) before doing
  it. Also: a brand/title in page chrome should navigate home — wrap it in a
  `<button class="header-home">` with `all: unset; cursor: pointer` and a
  `:focus-visible` brand outline, not an `onClick` on a bare `<h1>`.

## Icons

Line-drawn SVG on a 24px grid: `fill="none"`, `stroke="currentColor"`,
`stroke-width="1.8"` (2–2.5 for tiny/bold contexts), round caps and joins.
Never emoji, never filled icon fonts. A ready React set (folder, home, key,
upload, trash, pencil, plus, x, chat, link, page, box, chevron) is in
[assets/Icons.tsx](assets/Icons.tsx) — copy it in and extend in the same
style. Icons take their color from text: `muted` at rest, `brand` when
active/selected.

## Composition rules

- Page chrome (headers, sidebars) sits directly on `paper` with 1.5px `line`
  dividers — no white bars. Content that needs lift goes in white `.card`s.
- Always set `html { scrollbar-gutter: stable both-edges; }` (already in the
  CSS assets). It reserves symmetric scrollbar gutters so centered layouts
  don't shift sideways when a filter, dialog, or growing list makes the page
  scrollable.
- Headings are 800 and tight; pair a `.kicker` above the page/hero title.
  On marketing-ish pages, color a key phrase of the hero `brand`.
- Links are `brand` at 600 weight, underline on hover only.
- Hover states tint with `paper-dark`, not gray and not brand-bg;
  selected/active states fill with the accent's `tint` + `brand` text/icon.
- Radius: 6px controls, 8–10px cards. Nothing fully rounded except avatars.
  This covers inputs too — square a search field to 6px like the buttons, never
  a `border-radius: 999px` pill.
- One button size per page. Resist making a "small" variant; use `.btn-ghost`
  when a real button is too heavy. The one exception is the mobile **capture
  tier** (56/64/104px) for thumb-zone logging controls. It lives only in the
  bottom third and never shares a row with 34px chrome. See
  [references/mobile-capture.md](references/mobile-capture.md).
- Code: inline code gets `paper-dark` bg + `line` border; blocks get the dark
  `#1d1f27` panel with 13px Source Code Pro.
- Empty states: 1.5px **dashed** `line-strong` border, `muted` text.
- Overlays: `ink` at 50%; toasts are `ink` with a hard black offset shadow.
  Prefer an **Undo toast** over an "Are you sure?" dialog for reversible
  actions, and inset floating toasts on the same side gutter as the cards.
- Warning callouts keep amber (`#FBF3DA` bg, `#E8C468` border, `#4A3A0A`
  text) — it reads correctly even on pink.
- Page/section titles are tight 800 `ink` headings (with an optional `.kicker`
  above) — **not** solid-color banners. A filled-`brand` header band is only
  ever a *card header* inside a rounded card; never drop one in as a standalone
  page title (it reads as a giant loud block, especially on mobile).

## Modals & mobile

The system is built mobile-first (it's often a PWA). Two failure modes come up
repeatedly — bake these in from the start:

- **Dialog/modal action rows must wrap and center.** A row of buttons that fits
  on desktop overflows a narrow modal and spills off both edges. Always:
  `display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;`. Center
  (not `flex-end`) so wrapped rows stay balanced instead of ragged-right. This
  applies to every modal/dialog footer, not just the busy ones.
- **Overlays center the modal** (`position: fixed; inset: 0; display: flex;
  align-items: center; justify-content: center; padding: 16px`) with scrim
  `ink` at 50%. The modal is a `.card` capped at `min(460px, 100%)`.
- **Nav / segmented controls stay one consistent 3D-button treatment** across
  every page — don't mix a segmented pill on one page with plain 3D buttons on
  another. On a mobile 2-column grid, a lone trailing item must span the full
  row (`grid-column: 1 / -1`) so it isn't orphaned in one column.
- **Keep one control height** (34px) so inline rows align; for dense inline row
  actions a 32px square is the only sanctioned smaller size — pick one per
  context and use it for every control in that row.
- **Align to one gutter, optically.** Every edge (cards, rails, sheets,
  docked buttons, floating toasts) sits on the same side gutter (18px on a
  phone). Pull edge ghost/icon buttons out by their padding (`margin-left:
  -9px` for a 16px icon in a 34px square, `-12px` for a text ghost) so their
  glyphs line up with the cards. Centre header titles with `grid-template-columns:
  1fr auto 1fr`, not `space-between`. Make filter-chip rails fill the row
  (`flex: 1 1 auto`) rather than clip the last chip. Check at 320px.
- **Log-first / tracker apps** (feed home, big docked "Log" button, bottom
  sheet of choice tiles, keypad capture, full-screen timer, Undo toasts):
  read [references/mobile-capture.md](references/mobile-capture.md). It has the
  component specs and an alignment and margin checklist with a measuring
  method.

## Re-hueing

The palette parameterizes cleanly: `paper`, `paper-dark`, `line`,
`line-strong`, and `muted` are one hue at decreasing lightness / rising
saturation. To get PostHog's original beige instead, swap those five for
`#EEEFE9 / #E4E5DE / #D0D1C9 / #B8BAAE / #5A5A57` and keep everything else.
Any other pastel works the same way; keep `ink`, `brand`, and the semantic
colors fixed.

## Standalone pages

For a single self-contained HTML page (report, demo, served markdown), inline
[assets/pink-posthog.css](assets/pink-posthog.css) in a `<style>` tag, add
the font links, and build with the same components. Fixed floating actions
(e.g. a copy button) are `.btn-secondary` pinned `top: 16px; right: 16px`,
flipping to `.btn-success` styling with a "✓" label for ~1.8s after firing.
