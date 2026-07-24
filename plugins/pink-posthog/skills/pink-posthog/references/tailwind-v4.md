# Pink PostHog with Tailwind v4

For projects using Tailwind v4 (`@import "tailwindcss"`), define the system
in the main CSS file. Tokens go in `@theme` so they generate utilities
(`bg-paper`, `text-ink`, `border-line`, `text-brand`, `accent-brand`, …);
components go in `@layer components` as plain classes used as
`class="btn btn-primary"`.

Add the Google Fonts links (Archivo + Source Code Pro) to `index.html` — see
SKILL.md.

```css
@import "tailwindcss";

@theme {
  --font-sans:
    "Archivo", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-mono:
    "Source Code Pro", ui-monospace, SFMono-Regular, Menlo, Consolas,
    monospace;

  --color-paper: #faedf0;
  --color-paper-dark: #f2dbe1;
  --color-ink: #151515;
  --color-muted: #6f5b61;
  --color-line: #e4c8cf;
  --color-line-strong: #c9a0ab;
  /* Accent — ask the user which set to use (see SKILL.md "Accent"):
     Classic  brand #f54e00  brand-dark #b23800  tint #fde8de
     Sky      brand #0369a1  brand-dark #075985  tint #e0f2fe
     Teal     brand #0f766e  brand-dark #134e4a  tint #ccfbf1
     Violet   brand #7c3aed  brand-dark #5b21b6  tint #ede9fe
     Berry    brand #be185d  brand-dark #9d174d  tint #fce7f3 */
  --color-brand: #f54e00;
  --color-brand-dark: #b23800;
  --color-tint: #fde8de;
  --color-success: #2f9110;
  --color-success-dark: #1e6309;
  --color-success-tint: #e7f4e0;
  --color-danger: #b91c1c;
  --color-danger-dark: #7f1d1d;
  --color-danger-tint: #fee2e2;
}

/* Reserve symmetric scrollbar gutters so the page never shifts sideways
   when content grows past the viewport, and stays visually centered. */
html {
  scrollbar-gutter: stable both-edges;
}

body {
  @apply bg-paper font-sans text-ink antialiased;
}

@layer components {
  /* 3D button: hard bottom edge that depresses on click. One fixed
     height for every button on the page. */
  .btn {
    --btn-edge: var(--color-line-strong);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    height: 2.125rem;
    border: 1.5px solid var(--btn-edge);
    border-radius: 6px;
    box-shadow: 0 2px 0 var(--btn-edge);
    padding: 0 0.9rem;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.25;
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
    transition:
      transform 0.05s ease,
      box-shadow 0.05s ease,
      filter 0.1s ease;
  }
  .btn:active:not(:disabled) {
    transform: translateY(2px);
    box-shadow: none;
  }
  .btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .btn-primary {
    --btn-edge: var(--color-brand-dark);
    background: var(--color-brand);
    color: #fff;
  }
  .btn-primary:hover:not(:disabled) {
    filter: brightness(1.06);
  }
  .btn-secondary {
    background: #fff;
    color: var(--color-ink);
  }
  .btn-secondary:hover:not(:disabled) {
    background: #fff7f8;
  }
  .btn-danger {
    --btn-edge: var(--color-danger-dark);
    background: var(--color-danger);
    color: #fff;
  }
  .btn-danger:hover:not(:disabled) {
    filter: brightness(1.08);
  }
  .btn-success {
    --btn-edge: var(--color-success-dark);
    background: var(--color-success);
    color: #fff;
  }

  /* Borderless variant — same height and type as .btn. */
  .btn-ghost {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    height: 2.125rem;
    border-radius: 6px;
    padding: 0 0.65rem;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.25;
    white-space: nowrap;
    color: var(--color-muted);
    cursor: pointer;
    user-select: none;
  }
  .btn-ghost:hover {
    background: var(--color-paper-dark);
    color: var(--color-ink);
  }
  .btn-ghost-danger {
    color: var(--color-danger);
  }
  .btn-ghost-danger:hover {
    background: #fee2e2;
    color: var(--color-danger);
  }

  .card {
    background: #fff;
    border: 1.5px solid var(--color-line);
    border-radius: 8px;
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.06);
  }

  .input {
    width: 100%;
    height: 2.125rem; /* matches .btn so paired input+button rows align */
    border: 1.5px solid var(--color-line);
    border-radius: 6px;
    background: #fff;
    padding: 0 0.75rem;
    font-size: 0.875rem;
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.04);
    outline: none;
  }
  .input:focus {
    border-color: var(--color-brand);
  }

  /* Uppercase kicker label. Do NOT name this "overline" — that collides
     with Tailwind's built-in text-decoration utility and draws a line
     above the text. */
  .kicker {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
}
```

## Usage idioms seen in practice

- Header: `border-b-[1.5px] border-line bg-paper px-6 py-3`, logo as
  `flex items-center gap-2 text-lg font-extrabold tracking-tight` with a
  brand-colored icon.
- Sidebar rows: `rounded-md px-2 py-1.5 text-sm font-semibold`, selected
  `bg-tint font-bold text-brand` with `text-brand` icon, hover
  `hover:bg-paper-dark/60`.
- Table: wrap in `.card overflow-x-auto`; header row
  `kicker border-b-[1.5px] border-line text-left text-muted` with
  `px-4 py-3` cells; body rows `border-b border-line/60 hover:bg-paper/50`;
  row titles are `font-semibold text-brand hover:underline` links.
- Modals: overlay `bg-ink/50`, panel
  `card w-full max-w-md p-5 shadow-[0_4px_0_rgba(0,0,0,.15)]`, title
  `text-lg font-extrabold tracking-tight`.
- Empty state: `border-[1.5px] border-dashed border-line-strong text-muted`.
- Toast: fixed bottom-center, `border-[1.5px] border-black bg-ink text-white
  shadow-[0_2px_0_rgba(0,0,0,.4)] rounded-md text-sm font-semibold`.
