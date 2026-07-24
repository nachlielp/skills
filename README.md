# skills

Two [Agent Skills](https://docs.claude.com/en/docs/claude-code/skills) for Claude Code,
packaged as a plugin marketplace so you can install them with one command.

| Skill | What it does |
| --- | --- |
| [**pink-posthog**](plugins/pink-posthog) | A complete design system for building UIs that look good by default — pink paper background, extrabold Archivo headings, white cards with hard offset shadows, chunky 3D press-down buttons, a selectable accent. Ships plain CSS, a Tailwind v4 `@theme` setup, and a themed React component library. |
| [**convex-clerk-pwa**](plugins/convex-clerk-pwa) | Build or retrofit a production React + Vite PWA on Convex, Clerk and Vercel — web-push notifications that work on iOS, and a versioning system that keeps the app cached offline yet never serves a stale build after a deploy. Includes working file templates and a preflight script. |

They're independent — install either one on its own.

## Install

### As a plugin (recommended)

In Claude Code:

```
/plugin marketplace add nachlielp/skills
```

Then install whichever you want:

```
/plugin install pink-posthog@nachlielp-skills
```

```
/plugin install convex-clerk-pwa@nachlielp-skills
```

Plugin skills are available in every project, and `/plugin marketplace update`
pulls later changes.

### By copying the skill folder

If you'd rather not use plugins, copy a skill directory to either location —
`~/.claude/skills/` for all your projects, or `.claude/skills/` inside one repo:

```bash
git clone https://github.com/nachlielp/skills.git /tmp/nachlielp-skills && cp -R /tmp/nachlielp-skills/plugins/*/skills/* ~/.claude/skills/
```

To take just one, point at that skill instead of `plugins/*/skills/*` — for example
`/tmp/nachlielp-skills/plugins/pink-posthog/skills/pink-posthog`.

## Using them

Skills load themselves when a request matches. Ask for what you want in plain
language — "build me a dashboard that looks polished", "set up a new app with
Convex, Clerk and push notifications", "my deployed PWA keeps serving stale
builds" — and Claude will pull in the relevant skill. You can also invoke one
by name: `/pink-posthog`, `/convex-clerk-pwa`.

Requires Claude Code v2.0.10+ for plugin installs. `convex-clerk-pwa` expects
Node ≥ 20 and pnpm in the projects it builds; `pink-posthog` has no
dependencies beyond what your project already uses (its React component set
uses Radix and `cva`).

## Repo layout

```
.claude-plugin/marketplace.json     the marketplace manifest
plugins/<name>/.claude-plugin/      per-plugin manifest
plugins/<name>/skills/<name>/       the skill itself — SKILL.md, references/, assets/, scripts/
```

## License

MIT — see [LICENSE](LICENSE). Fork it, re-hue it, make it yours; the
`pink-posthog` skill has a "Re-hueing" section for exactly that.
