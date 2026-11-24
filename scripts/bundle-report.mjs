// First-load JS per route, gzipped, measured from the real HTML of a running
// production server (`npm run build && npm start`). Lazy chunks (charts, 3D)
// are not in the HTML, so they are not counted here; they load on demand.
//
//   node scripts/bundle-report.mjs [baseUrl] [--json out.json]
//
// Signed-in routes are fetched as the public demo account (read-only).
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
import path from "node:path";

const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith("http")) ?? "http://localhost:3000";
const jsonOut = args.includes("--json") ? args[args.indexOf("--json") + 1] : null;

const publicRoutes = ["/", "/login", "/signup", "/this-page-does-not-exist"];
const appRoutes = [
  "/dashboard",
  "/leads",
  "/leads/demo-lead-01",
  "/pipeline",
  "/follow-ups",
  "/analytics",
  "/team",
  "/billing",
  "/settings",
];

async function demoCookie() {
  const res = await fetch(`${base}/api/demo/login`, {
    method: "POST",
    redirect: "manual",
    headers: { origin: base },
  });
  const cookies = res.headers.getSetCookie?.() ?? [];
  return cookies.map((c) => c.split(";")[0]).join("; ");
}

const gzCache = new Map();
function gzSize(src) {
  if (gzCache.has(src)) return gzCache.get(src);
  const rel = src.replace(/^\/_next\//, "").split("?")[0];
  const file = path.join(".next", decodeURIComponent(rel));
  const size = existsSync(file) ? gzipSync(readFileSync(file)).length : 0;
  gzCache.set(src, size);
  return size;
}

async function measure(route, cookie) {
  const res = await fetch(base + route, { headers: cookie ? { cookie } : {}, redirect: "manual" });
  const html = await res.text();
  const srcs = [...new Set([...html.matchAll(/src="(\/_next\/static\/[^"]+\.js)"/g)].map((m) => m[1]))];
  const bytes = srcs.reduce((sum, s) => sum + gzSize(s), 0);
  return { route, status: res.status, scripts: srcs.length, kb: +(bytes / 1024).toFixed(1) };
}

const cookie = await demoCookie();
if (!cookie) console.warn("Demo sign-in failed; signed-in routes will show redirects.");
const rows = [];
for (const r of publicRoutes) rows.push(await measure(r, ""));
for (const r of appRoutes) rows.push(await measure(r, cookie));

console.log("route".padEnd(64), "status", "scripts", "first-load JS (gzip)");
for (const r of rows) {
  console.log(r.route.padEnd(64), String(r.status).padEnd(6), String(r.scripts).padEnd(7), `${r.kb} kB`);
}
if (jsonOut) writeFileSync(jsonOut, JSON.stringify(rows, null, 2));
