# pink-posthog

PostHog.com's design language re-hued onto pink paper — packaged as a Claude
Code skill so Claude builds in this style without being re-briefed every time.

The look: warm pink paper background, near-black ink text, one strong accent
color, chunky extrabold Archivo headings, white cards with thin pink borders
and hard offset shadows, and buttons that physically depress 2px when clicked.
Playful but disciplined — the fun comes from weight, color, and physics, never
from gradients, blurs, or rounded-full pills.

## Install

```
/plugin marketplace add nachlielp/skills
```

```
/plugin install pink-posthog@nachlielp-skills
```

Or copy [`skills/pink-posthog`](skills/pink-posthog) into `~/.claude/skills/`
(all projects) or `.claude/skills/` (one project).

## When it activates

Automatically, whenever you ask for a UI, landing page, dashboard, admin app,
demo, or self-contained HTML report and either name this look or leave the
design open — "make it look polished", "my usual style", "pink theme",
"chunky 3D buttons". Invoke it directly with `/pink-posthog`.

The first thing it does on a new build is ask which accent you want: sky, teal,
violet, berry, or the classic PostHog orange. All five pass WCAG AA at the
system's UI weights.

## What's in it

- **[SKILL.md](skills/pink-posthog/SKILL.md)** — the full system: design
  tokens, fonts, component specs, composition rules, and the mobile/modal
  failure modes worth baking in from the start.
- **[assets/pink-posthog.css](skills/pink-posthog/assets/pink-posthog.css)** —
  drop-in plain CSS. Inline it in a `<style>` tag for a standalone HTML page.
- **[assets/react/](skills/pink-posthog/assets/react)** — a shadcn-style React
  component library (Radix + `cva` + Tailwind v4), already themed: Button,
  Card, Input, Textarea, Label, Badge, Callout, Kicker, Dialog/Modal, Popover,
  Select, DropdownMenu, Tabs, Switch, Checkbox, Slider, Tooltip, Table,
  Calendar, DatePicker, plus `ToastProvider`/`useToast` and
  `ConfirmProvider`/`useConfirm`.
- **[references/tailwind-v4.md](skills/pink-posthog/references/tailwind-v4.md)**
  — the same system as an `@theme` block + component layer.
- **[references/react-components.md](skills/pink-posthog/references/react-components.md)**
  — setup, dependency list, and provider wiring for the React set.
- **[references/select-dropdown.md](skills/pink-posthog/references/select-dropdown.md)**
  — theming the *open* native `<select>` list via `::picker(select)`, and its
  gotchas.

## Making it your own

The palette parameterizes cleanly. `paper`, `paper-dark`, `line`,
`line-strong` and `muted` are one hue at decreasing lightness and rising
saturation — swap those five for any other pastel, keep `ink`, the accent, and
the semantic colors, and the whole system re-hues. The "Re-hueing" section of
SKILL.md includes PostHog's original beige values.
