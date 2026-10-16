# Mobile capture screens & alignment

Patterns for phone-first apps whose main job is *logging something fast*:
trackers, journals, fitness, expenses, checklists. They come from the Daily
"Logbook" redesign, where any entry takes three taps or fewer, one-handed.
Everything here stays inside the system: tokens, hard shadows, and 3D buttons
that press down.

Read this file when a build has a home screen that is a feed or log, a big
primary "add" action, numeric entry, a workout or timer "focus mode", or bottom
sheets. Its alignment checklist applies to any mobile screen.

## Capture tier: the one sanctioned exception to "one button size"

Chrome stays at the 34px `.btn` (headers, filter chips, context chips, row
actions). Controls the thumb uses to *capture* get bigger. They only ever
appear in the bottom third of the screen, and **never share a row with 34px
chrome**.

| Control | Height | Edge (border + hard shadow) | Radius | Type |
| --- | --- | --- | --- | --- |
| Capture button / field `.xl` | 56px | 2px border, `0 4px 0` | 8px | 17px / 800 |
| Docked primary "Log" `.logbtn` | 64px | 2px border, `0 5px 0` | 10px | 21px / 800 |
| Focus-mode button `.doneset` | 104px | 2px border, `0 7px 0` | 12px | 30px / 800 |
| Keypad key `.key` | 56px | 1.5px border, `0 3px 0` | 8px | 24px / 800 |

All of them press down by exactly their shadow depth on `:active`, the same
physics as `.btn`.

```css
.xl {
  --e: var(--line-strong);
  height: 56px; width: 100%;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  border: 2px solid var(--e); border-radius: 8px; box-shadow: 0 4px 0 var(--e);
  background: #fff; color: var(--ink);
  font: 800 17px/1 var(--font-sans); cursor: pointer;
  transition: transform .06s, box-shadow .06s;
}
.xl:active { transform: translateY(4px); box-shadow: 0 0 0 var(--e); }
.xl.primary { --e: var(--brand-dark); background: var(--brand); color: #fff; }
.logbtn { height: 64px; font-size: 21px; border-radius: 10px; box-shadow: 0 5px 0 var(--e); }
.logbtn:active { transform: translateY(5px); }
.key {
  --e: var(--line-strong);
  height: 56px; border: 1.5px solid var(--e); border-radius: 8px;
  box-shadow: 0 3px 0 var(--e); background: #fff;
  font: 800 24px/1 var(--font-sans); color: var(--ink);
}
.key:active { transform: translateY(3px); box-shadow: 0 0 0 var(--e); }
.key.fn { background: var(--paper-dark); } /* ".", backspace */
```

## Screen anatomy

```
status bar
header .hd / .ctop     52px, 18px side padding
page   .pg             flex:1, overflow auto, 18px side padding, 10px gap
dock   .dock           12px top / 30px bottom (home indicator), 1.5px line top border
```

- **One gutter everywhere: 18px** on a 375px-wide phone. The header, page,
  dock, sheets *and floating toasts* all use it, so every card edge lines up.
- **Dock** holds the one primary action, full width. On a home or filtered
  view it is the 64px `.logbtn`, and its label becomes contextual ("Log
  workout", "Log refuel", "Add task"). On a capture screen it is a 56px `.xl`
  that confirms the entry ("Log refuel · ₪300.35").
- **Setup and management screens** (lists of plans, cars, flows) don't need a
  capture button. Put a 34px `.btn-primary` ("New plan") centred in the dock
  instead of a 56px bar.

## Feed / logbook home

- Group entries by day with a header row: two `.kicker`s, the day name on the
  left and the date on the right, `justify-content: space-between`.
- **Entry card:** a white `.card` (10px radius, 9px 12px padding, 12px gap)
  holding a 38px glyph "well" (`paper` fill, 1.5px `line`, 8px radius, line
  icon), then a title (15px / 800) and meta (12.5px muted, ellipsis), then a
  tabular-nums time pinned top-right.
- **Pin a due / suggested item** above the day groups as a card with an
  inline 34px primary button. That button is the one-tap path.
- **Just-logged entries** flash `success-tint` with a `success` border.
  Offline or queued entries get a **dashed** `line-strong` border, no shadow,
  and an amber "Queued" chip.

## Filter rail

A row of 34px chips ("All · Workouts · Mobility · …") where the active one
uses `tint` with a `brand` edge. **Make the chips fill the row**
(`.rail .btn { flex: 1 1 auto; padding: 0 6px; }`) instead of letting the rail
overflow. With `overflow: hidden`, the last chip gets sliced at the gutter and
looks like a bug. If there are too many to fit, make the rail scroll
full-bleed (`margin: 0 -18px; padding: 0 18px; overflow-x: auto`) so the cut
happens at the screen edge, not at the gutter.

## Bottom sheet "What happened?"

- A white sheet with a 12px top radius, 1.5px `line` top border,
  `10px 18px 34px` padding, a 44×5px `line-strong` grab handle, and an `ink`
  50% scrim behind it.
- Header: a `.kicker` above a 26px / 800 title, with a ghost close button
  on the right.
- **Choice tiles:** a 2-column grid, 10px gap. Each tile is 96px tall, white,
  with a 1.5px `line-strong` edge and `0 4px 0` shadow. It holds a 28px brand
  line icon, an 18px / 800 label, and a muted sub-label that carries live
  context ("Next: Pull day", "1 due · 3 flows"). A lone last tile spans both
  columns at 64px.
- A **suggestion tile** sits above the grid: `tint` fill, `brand` edge,
  "Log now ›" on the right. It logs on tap, and an Undo toast takes the place
  of a confirm dialog.

## Capture screen

- **Header:** close or back, then a centred kicker + title, then a right
  slot (see the alignment rules: use a 3-column grid).
- **Context chips:** 34px `.btn`s showing smart defaults (car, date, parent
  item). Tapping one opens a small sheet. When the value isn't the default,
  the chip turns `tint`.
- **Readout:** a big centred tabular number (64px / 800, unit at 22px muted),
  with a one-line muted hint below ("Last refuel 83,640 · +572 km", with the
  delta in `success`).
- **Field tabs:** a 3-column grid of small white tiles (kicker label, 20px /
  800 value, 10.5px "last fill" note). The active tile is `tint` with a
  `brand` border and receives keypad input.
- **Keypad:** a 3×4 grid of `.key`s with an 8px gap; "." and backspace use
  `.key.fn`. It replaces the OS number keyboard, so the confirm button never
  gets covered.
- **Stepper** for small integers: a 64×56 `.key` on each side of a 40px / 800
  value with a 12px muted unit underneath. Optional quick chips go below it,
  **centred** to match the centred value.

## Focus mode (runner / timer)

Full-screen and distraction-free:

- **Progress segments** at the top: 8px bars with a 4px gap. Done is `brand`,
  current is `ink`, the rest are `line`.
- **The current item:** a 40px / 800 name, then a 136px / 800 tabular number
  with a 24px muted unit.
- **An "Up next" card** pinned above the 104px focus button with
  `margin-top: auto`.
- **Rest countdown:** a giant tabular number over a flat 16px bar that drains
  (a white track with a `brand` fill, no ring and no gradient), plus −15 s /
  +15 s `.xl` buttons. For "Skip rest", the focus button flips to white.
- **Ghost "Previous" / "Skip"** sit in a `space-between` row under the main
  button (see optical alignment below).

## Undo toast (instead of "Are you sure?")

```css
.toast {
  position: absolute; left: 18px; right: 18px;   /* same gutter as the cards */
  bottom: calc(dock-height + 11px);              /* 11px clear of the dock */
  display: flex; align-items: center; gap: 10px;
  background: var(--ink); color: #fff; border-radius: 8px;
  box-shadow: 4px 4px 0 #000; padding: 8px 8px 8px 14px;
  font-weight: 700; font-size: 14px;
}
.toast span { flex: 1; min-width: 0; line-height: 1.25; }
.toast span small {           /* second line: details, never wraps */
  display: block; font-size: 12px; font-weight: 600; color: #c9b8bd;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
```

- Undo is a dark 34px 3D button inside the toast (`#2a2a2a` fill, `#4a4a4a`
  edge, `0 2px 0 #000`). Retry uses the same shape with an alert icon in
  `danger-tint`.
- Keep the title short ("Task checked", "Logged refuel"). Item names go in
  the ellipsised second line. A quoted item name in the title wraps to three
  lines on a phone.
- Keep the same distance above the dock on every screen, even when the
  dock's height changes (a 64px Log button versus a 56px confirm button).

## Alignment & margin checklist

Run through this before calling a phone screen done. Every item here was a
real bug in a polished-looking mock.

1. **Every horizontal edge sits on the 18px gutter**: cards, rails, sheets,
   docked buttons *and floating toasts*. A toast at 14px looks fine on its
   own and wrong next to the cards. Measure the left and right offsets; don't
   eyeball them.
2. **Optically align edge ghost buttons.** A ghost or icon button at the start
   or end of a row has invisible padding, so its glyph sits 9–12px inside the
   gutter. Pull it out with a negative margin:
   ```css
   .ctop > .btn-ghost.square:first-child { margin-left: -9px; }   /* 16px icon in 34px */
   .ctop > .btn-ghost:not(.square):first-child { margin-left: -12px; }
   .titlerow > .btn-ghost:last-child { margin-right: -12px; }      /* "Manage" */
   .ghost-row { display: flex; justify-content: space-between; margin: 0 -12px; }
   ```
3. **Centre header titles with a 3-column grid, not `space-between`.** With
   uneven sides (a "‹ Workouts" back link versus a 34px spacer), a
   `space-between` title drifts off-centre.
   ```css
   .ctop { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 8px; }
   .ctop > :first-child { justify-self: start; }
   .ctop > :last-child  { justify-self: end; white-space: nowrap; }
   ```
   This also stops a right-slot value (a "14:32" clock) from overflowing a
   fixed 34px spacer and being clipped at the screen edge.
4. **Rows of equal-weight controls are grids, not centred flex.** Three
   actions (Edit · Pause · Complete) use `repeat(3, 1fr)`. A colour-swatch
   row uses `repeat(n, 1fr)` with `aspect-ratio: 1`, so it spans the full
   width instead of ending short.
5. **Labels go above their controls**, as an 11px `.kicker` with
   `margin-bottom: -4px` inside a 10px-gap column. Never put the label after
   a chip row.
6. **Lone list-style rows go in a card.** A settings link left floating below
   a `.list` card has its icon on a different x than the rows above it. Wrap
   it in its own `.list` card.
7. **Bottom clipping:** in a scroll area under the dock, either the last card
   fits completely or it is clearly cut mid-card. A 2–5px sliver of a border
   reads as a mistake.
8. **Test at 375, 390 and 320px wide.** Phone frames, hero type and nowrap
   badges are the usual cause of sideways overflow at 320. Add a
   `max-width: 380px` breakpoint that scales them down.

### Measuring instead of eyeballing

A headless check (Playwright) that walks each screen and reports:

- elements extending past the screen (`getBoundingClientRect` versus the
  phone or viewport)
- text whose `scrollWidth > clientWidth` without an ellipsis
- the set of distinct left and right offsets among a scroll area's direct
  children, which should be one value
- toast left and right offsets plus the gap to the dock
- for each filter rail, the last chip's right edge minus the rail's right edge

Then screenshot each screen at 2× and review them four at a time in a
contact sheet. That finds the remaining optical issues: ghost-icon insets,
off-centre titles, ragged rows.
