#!/usr/bin/env node
// Signed-out production smoke test for a Vite PWA on Vercel.
// Usage:
//   node prod-smoke.mjs --url https://app.example.com \
//     [--old index-AbC123.js]        wait until prod stops serving this entry bundle
//     [--convex my-prod-123]         the entry bundle must name this Convex deployment
//     [--marker "text"]...           must appear in some JS chunk (lazy routes included)
//     [--absent "text"]...           must appear in no JS chunk (removed code is gone)
//     [--css-marker "text"]...       must appear in some CSS file, in minified form
//     [--path /some/route]...        deep links that must serve the SPA shell
//     [--expect-text "Sign in"]      text the signed-out page must show
//     [--width 390] [--wait 600]
// It never signs in. Prod holds real data; do signed-in checks locally.
// Needs Playwright. Set PLAYWRIGHT_MODULE to the path of an installed
// playwright/index.mjs if it can't be resolved from here, and CHROMIUM_PATH
// to use a specific browser binary. Exits 1 if any check fails.

const args = process.argv.slice(2);
const many = (name) => args.flatMap((a, i) => (a === `--${name}` ? [args[i + 1]] : []));
const one = (name, fallback) => many(name).at(-1) ?? fallback;

const URL_ = one("url")?.replace(/\/$/, "");
if (!URL_) {
  console.error("missing --url");
  process.exit(2);
}
const OLD = one("old");
const WIDTH = Number(one("width", "390"));
const WAIT = Number(one("wait", "600"));

const results = [];
const check = (name, ok, info = "") =>
  results.push(`${ok ? "PASS" : "FAIL"}  ${name}${info ? `  — ${info}` : ""}`);
const get = async (path) => {
  const r = await fetch(URL_ + path, { cache: "no-store" });
  return { status: r.status, text: await r.text() };
};
const entryOf = (html) => html.match(/\/assets\/index-[A-Za-z0-9_-]+\.js/)?.[0];

// 1. Wait for the deploy: the entry bundle's hash changes when the build does.
let html = (await get("/")).text;
let entry = entryOf(html);
if (OLD) {
  const deadline = Date.now() + WAIT * 1000;
  while (entry?.endsWith(OLD) && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 10_000));
    html = (await get("/")).text;
    entry = entryOf(html);
  }
  check("prod serves a new bundle", entry && !entry.endsWith(OLD), entry ?? "no entry bundle");
} else {
  check("prod serves an entry bundle", !!entry, entry ?? "none");
}

// 2. Walk every JS chunk reachable from the entry. Routes are lazy, so a
// feature's code is usually in a chunk the entry only names.
const js = new Map();
const css = new Set(html.match(/\/assets\/[A-Za-z0-9_.-]+\.css/g) ?? []);
const queue = entry ? [entry] : [];
while (queue.length) {
  const path = queue.shift();
  if (js.has(path)) continue;
  const { text } = await get(path);
  js.set(path, text);
  for (const m of text.match(/assets\/[A-Za-z0-9_.-]+\.(js|css)/g) ?? []) {
    const p = `/${m}`;
    if (p.endsWith(".css")) css.add(p);
    else if (!js.has(p)) queue.push(p);
  }
}
const allJs = [...js.values()];
const entryText = entry ? js.get(entry) ?? "" : "";

const convex = one("convex");
if (convex) check(`bundle points at Convex ${convex}`, entryText.includes(convex));
for (const m of many("marker"))
  check(`shipped: ${m}`, allJs.some((t) => t.includes(m)), `${js.size} chunks`);
for (const m of many("absent"))
  check(`gone: ${m}`, !allJs.some((t) => t.includes(m)));
if (many("css-marker").length) {
  const cssText = await Promise.all([...css].map(async (p) => (await get(p)).text));
  for (const m of many("css-marker"))
    check(`CSS shipped: ${m}`, cssText.some((t) => t.includes(m)), [...css].join(","));
}

// 3. Deep links must serve the SPA shell (vercel.json rewrite).
for (const p of many("path")) {
  const r = await get(p);
  check(`deep link ${p}`, r.status === 200 && r.text.includes('id="root"'), String(r.status));
}

// 4. A real browser, signed out.
const pw = await import(process.env.PLAYWRIGHT_MODULE ?? "playwright");
const browser = await pw.chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
const context = await browser.newContext({
  viewport: { width: WIDTH, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
const errors = [];
const failed = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
page.on("requestfailed", (r) => failed.push(`${r.url().slice(0, 80)} ${r.failure()?.errorText}`));
page.on("response", (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url().slice(0, 80)}`));

await page.goto(URL_ + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(1500);
check("app rendered", (await page.locator("#root > *").count()) > 0);
const expectText = one("expect-text");
if (expectText)
  check(`page shows "${expectText}"`, (await page.getByText(expectText).count()) > 0);

// Wait for the worker instead of reading getRegistration() right after load:
// on a first visit it is still installing, and the check fails on timing.
const sw = await page.evaluate(() =>
  Promise.race([
    navigator.serviceWorker?.ready.then((r) => `${r.active?.scriptURL} (${r.active?.state})`),
    new Promise((resolve) => setTimeout(() => resolve(null), 20_000)),
  ]),
);
check("service worker active", !!sw, sw ?? "not ready after 20s");

const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
check(`no horizontal overflow at ${WIDTH}`, scrollWidth <= WIDTH, String(scrollWidth));
check("no console errors", errors.length === 0, errors.join(" / ").slice(0, 300));
check("no failed requests", failed.length === 0, failed.join(" / ").slice(0, 300));
await browser.close();

console.log(results.join("\n"));
process.exit(results.some((r) => r.startsWith("FAIL")) ? 1 : 0);
