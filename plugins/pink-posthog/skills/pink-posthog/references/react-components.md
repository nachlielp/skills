# Pink PostHog React component library

A shadcn-style component set (Radix primitives + Tailwind v4 + `cva`) already
themed to this design system. Source lives in
[assets/react/](../assets/react/). Copy it into a React + Tailwind v4 project
rather than re-deriving the components.

Use this when the project is a **React + Tailwind v4** app. For a standalone
HTML page, use [assets/pink-posthog.css](../assets/pink-posthog.css) instead;
for the raw Tailwind theme without React, see
[tailwind-v4.md](tailwind-v4.md).

## Install

```bash
# Radix primitives used by the interactive components
npm install @radix-ui/react-slot @radix-ui/react-label @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-switch \
  @radix-ui/react-checkbox @radix-ui/react-tabs @radix-ui/react-tooltip \
  @radix-ui/react-popover @radix-ui/react-slider
# utilities
npm install class-variance-authority clsx tailwind-merge
```

Then copy `assets/react/`:

- `theme.css` → your Tailwind entry (e.g. `src/index.css`). It is `@import
  "tailwindcss"` + the `@theme` tokens + the `.btn`/`.card`/`.input`/`.kicker`
  component layer + the Radix keyframes. **Set the accent** in the `@theme`
  block first (default is classic orange — see the comment block; ask the user
  which accent per SKILL.md).
- `components/` and `lib/` → `src/components/` and `src/lib/`.
- Add the `@` path alias (`"@/*": ["./src/*"]`) in `tsconfig` and the bundler
  (Vite: `resolve.alias`), since components import from `@/components/ui/…` and
  `@/lib/utils`.
- Add the Archivo + Source Code Pro font links to `index.html` (see SKILL.md).

## Components (`@/components/ui`)

`Button` (`primary`/`secondary`/`success`/`danger`/`ghost`/`ghost-danger`,
`asChild`), `Card` (+ `Header`/`Title`/`Description`/`Content`/`Footer`),
`Input`, `Textarea`, `Label`, `Badge`, `Callout`, `Kicker`, `Dialog`
(primitives), `Modal` (convenience wrapper), `Popover`, `Select`,
`DropdownMenu`, `Tabs`, `Switch`, `Checkbox`, `Slider`, `Tooltip`, `Table`
(+ `TableCard`/…), `Calendar`, `DatePicker` (pass `withTime` for a date+time
picker whose HH:MM control opens one popover with hours + minutes sliders).

Imperative helpers with providers mounted once near the root:

```tsx
<ToastProvider>          {/* useToast().toast("Saved", "success") */}
  <ConfirmProvider>      {/* const ok = await useConfirm()({ title, variant: "danger" }) */}
    <App />
  </ConfirmProvider>
</ToastProvider>
```

Line-drawn icons are in `components/Icons.tsx` (24px grid, `currentColor`).

## Conventions baked in

- One 34px control height; inputs and buttons share a 6px radius so paired
  rows align. No pills, no blur shadows.
- Overlays (dialog/popover/menu/select) are white `.card` popups with a hard
  offset shadow; toasts/tooltips are `ink` with a hard black offset shadow.
- Selected/active fills use the accent `tint`; semantic states (success,
  danger) use their own tint — never the accent hue.
- Nested overlays (a Select or Popover inside a Popover) rely on Radix layer
  nesting so the inner one doesn't dismiss the outer — keep them React
  descendants, don't detach the portals.
