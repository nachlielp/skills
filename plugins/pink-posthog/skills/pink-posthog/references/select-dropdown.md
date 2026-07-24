# Themed `<select>` dropdown

How to make a `<select>` match the pink-PostHog system — both the closed
control **and** the open list. Native option lists can't be styled, so the
open list needs the **customizable `<select>`** API (`appearance: base-select`
+ `::picker(select)`), which only exists in Chromium 135+. Treat it as
progressive enhancement: gate everything behind
`@supports (appearance: base-select)` so Safari / iOS / iPad keep their native
list (which is fine — the *closed* control still matches).

The closed control alone is easy: style `<select>` exactly like `.input`
(white, 1.5px `line`, 6px radius, `0 2px 0` hard shadow, focus → `brand`
border) with `appearance: none` and a background-image chevron. Everything
below is for theming the **open** list, and it's where the sharp edges are.

## Verifying it

The open popup renders in the browser's **top layer**, so screenshot tools
dismiss it the moment they capture. Don't try to screenshot the open list —
verify with `getComputedStyle` on the select, its options, `.select-value`,
etc. The closed-control chevron *is* screenshottable.

## The opt-in + popup card

```css
@supports (appearance: base-select) {
  select,
  select::picker(select) {
    appearance: base-select;          /* both sides must opt in */
  }

  select::picker(select) {
    border: 1.5px solid var(--line);
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.06);   /* hard offset, like .card */
    padding: 4px;
    margin-top: 6px;
    box-sizing: border-box;
    width: anchor-size(width);         /* pin to the select — never wider */
    overflow-y: auto;                  /* NO fixed max-height (see below) */
  }
}
```

- **Pin the width.** `width: anchor-size(width)` (the picker is auto-anchored
  to its select) stops the popup growing wider than the control. Then let long
  option labels wrap instead of stretching: on `option`, set
  `white-space: normal; overflow-wrap: anywhere;`.
- **No fixed `max-height`.** A hard cap (e.g. `320px`) truncates the list and
  forces a scrollbar even when there's room. Omit it and keep
  `overflow-y: auto`: the UA constrains the popup to the viewport, so it scrolls
  *only* once the list reaches the window boundary.

## Options + group headers

```css
@supports (appearance: base-select) {
  select option {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 10px; border-radius: 6px;
    font-size: .875rem; font-weight: 600; color: var(--ink);
    text-transform: none; letter-spacing: normal;   /* ← see gotcha */
    white-space: normal; overflow-wrap: anywhere;
  }
  select option:hover,
  select option:focus  { background: var(--paper-dark); outline: none; }
  select option:checked{ background: var(--tint); color: var(--brand); }
  select option::checkmark { order: 1; margin-left: auto; color: var(--brand); }

  /* Group header = muted kicker; divider between groups (antd-style) */
  select optgroup {
    padding: 6px 10px 4px;
    font-size: 11px; font-weight: 800; letter-spacing: .08em;
    text-transform: uppercase; color: var(--muted);
  }
  select optgroup:not(:first-of-type) {
    margin-top: 4px; padding-top: 10px; border-top: 1.5px solid var(--line);
  }
}
```

**Gotcha — `optgroup` uppercases your options.** `text-transform` and
`letter-spacing` **inherit into the child `<option>`s**, so an uppercase/spaced
group header silently uppercases *every option row* too — and then headers no
longer stand out. Always reset `text-transform: none; letter-spacing: normal`
on `option`. Hover = `paper-dark`, selected = `tint` + `brand` (+ brand
`::checkmark`), exactly like the rest of the system.

## The chevron (two real bugs)

Replace the default filled triangle with the system's line chevron via
`::picker-icon` **or** your own caret span. Two things bite:

1. **viewBox.** The chevron path `m6 9 6 6 6-6` is drawn on a **24-unit grid**
   (x runs 6→18). A `width='16' height='16'` SVG with no `viewBox` clips the
   right half of the arrow. Always include `viewBox='0 0 24 24'` and scale with
   `background-size: 16px` (or `width/height='24'`).
2. **Alignment.** `base-select` makes the control a flexbox with
   `align-items: normal` (stretch) and keeps whatever right padding you reserved
   for the old background chevron. Set `align-items: center` and drop the right
   padding to ~`10px` so the caret lands 10px from the edge like the native
   fallback, vertically centered.

Rotate on open: `select:open ::picker-icon { transform: rotate(180deg); }`.

## Single-row ellipsis on the selected value

Under `base-select` the closed button **wraps** a long selected label to two
lines (and clips it in a fixed-height control). To force one row + ellipsis you
must style the value element — which only exists if you supply the spec's
explicit markup as the select's **first child**:

```html
<select>
  <button type="button" class="select-btn">
    <selectedcontent class="select-value"></selectedcontent>
    <span class="select-caret" aria-hidden="true"></span>
  </button>
  <optgroup>…</optgroup>
</select>
```

```css
@supports (appearance: base-select) {
  select::picker-icon { display: none; }        /* using our own caret */
  select .select-btn {
    all: unset; box-sizing: border-box;
    display: flex; align-items: center; gap: 8px;
    width: 100%; min-width: 0; font: inherit; color: inherit; cursor: inherit;
  }
  select .select-value {
    flex: 1 1 auto; min-width: 0;
    overflow: hidden; white-space: nowrap; text-overflow: ellipsis;
  }
  select .select-caret {
    flex: 0 0 auto; width: 16px; height: 16px;
    background: url("…viewBox='0 0 24 24'…chevron…") center / 16px no-repeat;
  }
}
```

Notes:

- **A bare `<selectedcontent>` doesn't work** — Chromium ignores it unless it's
  inside the `<button>`, and falls back to the wrapping default button.
- **Gate the markup on support.** Render the `<button>`/`<selectedcontent>`
  only when `CSS.supports('appearance','base-select')`; native browsers must
  *not* get a `<button>` inside `<select>` (invalid there). In React:
  `const SUPPORTS_BASE_SELECT = typeof CSS !== 'undefined' &&
  CSS.supports?.('appearance','base-select')`, and build the node with
  `createElement('selectedcontent', …)` to dodge the TS "unknown intrinsic
  element" error.
- **React dev warning is expected.** React's dev-only DOM-nesting check logs
  `<button> cannot be a child of <select>` (it hasn't learned this is now
  valid). It's harmless — stripped from production builds, and there's no
  hydration in a client-rendered SPA. Leave the spec-correct markup; don't
  fight it with fragile imperative-DOM hacks.

## Full-text tooltip on truncation

Since the value truncates, reveal the full label on hover with a **themed** ink
toast (not the un-styleable native `title`). Wrap the select and drive an
`::after` from a `data-tooltip` attribute:

```css
.select-wrap { position: relative; display: block; width: 100%; }
.select-wrap[data-tooltip]:hover:not(:has(select:open))::after {
  content: attr(data-tooltip);
  position: absolute; left: 0; bottom: calc(100% + 6px); z-index: 20;
  width: max-content; max-width: min(340px, 88vw);
  padding: 6px 10px; border-radius: 6px;
  background: var(--ink); color: #fff;      /* ink toast, per the system */
  box-shadow: 0 2px 0 rgba(0, 0, 0, .25);   /* hard offset */
  font-size: .78rem; font-weight: 600; line-height: 1.35;
  white-space: normal; pointer-events: none;
}
```

`:not(:has(select:open))` hides the tooltip while the dropdown is open so it
doesn't collide with the list. Set `data-tooltip` to the same string used for
the option label (compute the label once and reuse it, so the button text and
tooltip can't drift).
