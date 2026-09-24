#!/usr/bin/env node
// flare.ts — read the Flare (flare.io) tenant feed and print safe, plain counts.
// Runs on Node 24 directly (type stripping). No dependencies.
//
// Env:  FLARE_API_KEY (required)  FLARE_TENANT_ID (optional)  FLARE_API_BASE (optional, default https://api.flare.io)
// Never prints credentials: every string that leaves this program passes through redact().

type Json = any;

const API = (process.env.FLARE_API_BASE || "https://api.flare.io").replace(/\/+$/, "");
const KEY = process.env.FLARE_API_KEY || "";
const TENANT = process.env.FLARE_TENANT_ID ? Number(process.env.FLARE_TENANT_ID) : undefined;

const args = process.argv.slice(2);
const cmd = args[0] || "help";
const opt = (name: string, dflt?: string): string | undefined => {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return dflt;
  const v = args[i + 1];
  return v && !v.startsWith("--") ? v : "true";
};
const JSON_OUT = args.includes("--json");

// ---------- safety ----------
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const SECRETY = /\b(password|passwd|pwd|cookie|cookies|token|secret|hash)\b\s*[:=]\s*\S+/gi;
function redact(s: string): string {
  return String(s).replace(EMAIL, "<email hidden>").replace(SECRETY, (m) => m.split(/[:=]/)[0] + ": <hidden>");
}
function out(text: string) {
  process.stdout.write(redact(text) + "\n");
}
function die(msg: string, code = 1): never {
  process.stderr.write(redact(msg) + "\n");
  process.exit(code);
}

// ---------- auth ----------
// FLARE_API_KEY is a Flare API key (app.flare.io → Profile → API Keys). It is exchanged for a
// one-hour API token on every run (https://api.docs.flare.io/concepts/authentication).
let bearer = "";
async function token(): Promise<string> {
  if (bearer) return bearer;
  if (!KEY) die("FLARE_API_KEY is not set. It should be bound to the Paperclip secret in this agent's Environment variables.");
  const body = TENANT ? JSON.stringify({ tenant_id: TENANT }) : undefined;
  const r = await fetch(`${API}/tokens/generate`, {
    method: "POST",
    headers: { Authorization: KEY.trim(), "Content-Type": "application/json", Accept: "application/json" },
    body,
  });
  if (!r.ok) die(`Flare refused the API key (HTTP ${r.status}). Check FLARE_API_KEY and that API keys are enabled on your Flare account.`);
  const j = (await r.json()) as Json;
  if (!j.token) die("Flare returned no token.");
  bearer = j.token;
  return bearer;
}
async function api(path: string, init: RequestInit = {}): Promise<Json> {
  const t = await token();
  const r = await fetch(`${API}${path}`, {
    ...init,
    headers: { ...(init.headers || {}), Authorization: `Bearer ${t}`, Accept: "application/json", "Content-Type": "application/json" },
  });
  if (r.status === 429) die("Flare rate limit hit. Try again in a minute.");
  if (!r.ok) die(`Flare API error HTTP ${r.status} on ${path}`);
  return r.json();
}

// ---------- helpers ----------
function sinceToIso(s: string): string {
  const m = /^(\d+)\s*(h|d|w)$/i.exec(s.trim());
  if (m) {
    const n = Number(m[1]);
    const ms = { h: 3600e3, d: 86400e3, w: 7 * 86400e3 }[m[2].toLowerCase() as "h" | "d" | "w"];
    return new Date(Date.now() - n * ms).toISOString();
  }
  const d = new Date(s);
  if (isNaN(d.getTime())) die(`Bad --since value: ${s}. Use 24h, 3d, 2w or an ISO date.`);
  return d.toISOString();
}
const TYPE_LABEL: Record<string, string> = {
  stealer_log: "infected device (stealer log)",
  bot: "infected device (bot market)",
  leak: "leaked credential",
  leaked_credential: "leaked credential",
  chat_message: "chat message (Telegram)",
  domain: "look-alike domain",
  domain_screenshot: "look-alike domain (screenshot)",
  domain_title: "look-alike domain (title)",
  domain_favicon: "look-alike domain (favicon)",
  ransomleak: "ransomware mention",
};
function label(t: string) {
  return TYPE_LABEL[t] || t;
}
function identName(i: { name?: string }) {
  return String(i?.name || "").replace(/^https?:\/\//, "");
}
function bump(m: Map<string, number>, k: string, n = 1) {
  m.set(k, (m.get(k) || 0) + n);
}
function sorted(m: Map<string, number>) {
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

// ---------- feed paging ----------
type FeedItem = {
  metadata: { uid: string; estimated_created_at?: string; matched_at?: string; type: string; severity?: string; flare_url?: string };
  identifiers?: { id: number; name: string }[];
  highlights?: Record<string, string[]>;
};
async function* feed(filters: Json, maxPages: number): AsyncGenerator<FeedItem> {
  let from: string | undefined;
  for (let page = 0; page < maxPages; page++) {
    const body: Json = { size: 10, order: "desc", filters };
    if (from) body.from = from;
    const j = await api("/firework/v4/events/tenant/_search", { method: "POST", body: JSON.stringify(body) });
    const items: FeedItem[] = j.items || [];
    for (const it of items) yield it;
    if (!j.next || items.length === 0) return;
    from = j.next;
  }
  // signal the cap
  yield { metadata: { uid: "__capped__", type: "__capped__" } } as FeedItem;
}

type Tally = {
  total: number;
  capped: boolean;
  byType: Map<string, number>;
  bySeverity: Map<string, number>;
  byIdentifier: Map<string, number>;
  newest?: string;
  oldest?: string;
  lookalikes: Map<string, string>; // domain -> newest matched_at
};
function tally(): Tally {
  return { total: 0, capped: false, byType: new Map(), bySeverity: new Map(), byIdentifier: new Map(), lookalikes: new Map() };
}
function add(t: Tally, it: FeedItem) {
  if (it.metadata.type === "__capped__") {
    t.capped = true;
    return;
  }
  t.total++;
  bump(t.byType, label(it.metadata.type));
  bump(t.bySeverity, it.metadata.severity || "unknown");
  for (const i of it.identifiers || []) bump(t.byIdentifier, identName(i));
  const m = it.metadata.matched_at || it.metadata.estimated_created_at || "";
  if (m) {
    if (!t.newest || m > t.newest) t.newest = m;
    if (!t.oldest || m < t.oldest) t.oldest = m;
  }
  if (/^domain/.test(it.metadata.type)) {
    const dm = /\/flare\/([^/]+)\//.exec(it.metadata.uid);
    if (dm) {
      const prev = t.lookalikes.get(dm[1]);
      if (!prev || m > prev) t.lookalikes.set(dm[1], m);
    }
  }
}
function printTally(title: string, t: Tally) {
  if (JSON_OUT) {
    out(
      JSON.stringify(
        {
          title,
          total: t.total,
          at_least: t.capped,
          by_type: Object.fromEntries(t.byType),
          by_severity: Object.fromEntries(t.bySeverity),
          by_identifier: Object.fromEntries(t.byIdentifier),
          newest: t.newest,
          oldest: t.oldest,
          lookalike_domains: Object.fromEntries(t.lookalikes),
        },
        null,
        2,
      ),
    );
    return;
  }
  const atLeast = t.capped ? "at least " : "";
  out(`${title}`);
  out(`Open events: ${atLeast}${t.total}${t.newest ? `  (newest ${t.newest.slice(0, 10)}, oldest ${t.oldest?.slice(0, 10)})` : ""}`);
  if (t.total === 0) return;
  out("By type:      " + sorted(t.byType).map(([k, v]) => `${k} ${v}`).join(" · "));
  out("By severity:  " + sorted(t.bySeverity).map(([k, v]) => `${k} ${v}`).join(" · "));
  out("By our domain: " + sorted(t.byIdentifier).map(([k, v]) => `${k} ${v}`).join(" · "));
  if (t.lookalikes.size) out("Look-alike domains: " + [...t.lookalikes.keys()].join(", "));
  if (t.capped) out(`(stopped at the page cap; raise --max-pages for more, or use 'identifiers' for all-time totals)`);
}

// ---------- commands ----------
async function cmdCheck() {
  const t = await token();
  const r = await fetch(`${API}/tokens/test`, { headers: { Authorization: `Bearer ${t}`, Accept: "application/json" } });
  if (!r.ok) die(`Token test failed: HTTP ${r.status}`);
  const j = (await r.json().catch(() => ({}))) as Json;
  out(`Flare API key works.${TENANT ? ` Tenant ${TENANT}.` : ""}${j.tenant_id ? ` (token tenant ${j.tenant_id})` : ""}`);
}

async function cmdIdentifiers() {
  const rows: { name: string; type: string; events: number | null; source: string }[] = [];
  let from: string | undefined;
  for (let p = 0; p < 10; p++) {
    const j = await api(`/firework/v4/identifiers/?size=100${from ? `&from=${encodeURIComponent(from)}` : ""}`);
    for (const i of j.items || []) {
      rows.push({
        name: identName(i),
        type: i.data?.type || "?",
        events: i.enrichments?.event_count ?? null,
        source: i.enrichments?.authorization_status || "",
      });
    }
    if (!j.next) break;
    from = j.next;
  }
  rows.sort((a, b) => (b.events || 0) - (a.events || 0));
  if (JSON_OUT) return out(JSON.stringify(rows, null, 2));
  out(`Identifiers plugged into Flare: ${rows.length}`);
  for (const r of rows) out(`  ${r.type.padEnd(9)} ${r.name.padEnd(36)} all-time events ${r.events ?? "?"}`);
  out("(identity identifiers hold people's emails; their names are shown, their emails are not)");
}

async function cmdSummary() {
  const days = Number(opt("days", "7"));
  const maxPages = Number(opt("max-pages", "50"));
  const type = opt("type");
  const filters: Json = { status: ["open"] };
  if (type) filters.type = type.split(",");
  if (days > 0) filters.estimated_created_at = { gte: new Date(Date.now() - days * 86400e3).toISOString() };
  const t = tally();
  for await (const it of feed(filters, maxPages)) add(t, it);
  printTally(`Flare summary — open events created in the last ${days} day(s)${type ? ` (${type})` : ""}`, t);
}

async function cmdNew() {
  const since = sinceToIso(opt("since", "24h")!);
  const maxPages = Number(opt("max-pages", "50"));
  const type = opt("type");
  const filters: Json = { status: ["open"] };
  if (type) filters.type = type.split(",");
  const t = tally();
  let olderSeen = 0;
  for await (const it of feed(filters, maxPages)) {
    if (it.metadata.type === "__capped__") {
      t.capped = true;
      break;
    }
    const m = it.metadata.matched_at || it.metadata.estimated_created_at || "";
    if (m && m < since) {
      // feed is newest-first; one full page of older items means we are done
      if (++olderSeen >= 10) break;
      continue;
    }
    add(t, it);
  }
  if (t.total === 0 && !JSON_OUT) return out(`Nothing new in Flare since ${since.slice(0, 16).replace("T", " ")} UTC.`);
  printTally(`Flare — new matches since ${since.slice(0, 16).replace("T", " ")} UTC`, t);
}

async function cmdLookalikes() {
  const t = tally();
  for await (const it of feed({ status: ["open"], type: ["domain"] }, Number(opt("max-pages", "20")))) add(t, it);
  if (JSON_OUT) return out(JSON.stringify(Object.fromEntries(t.lookalikes), null, 2));
  if (!t.lookalikes.size) return out("No look-alike domains on file.");
  out("Look-alike domains Flare has seen for us:");
  for (const [d, when] of [...t.lookalikes.entries()].sort((a, b) => (b[1] > a[1] ? 1 : -1))) out(`  ${d}   last activity ${when.slice(0, 10)}`);
}

async function cmdEvent() {
  const uid = args[1];
  if (!uid) die("Usage: event <uid>");
  const j = await api(`/firework/v2/activities/${encodeURIComponent(uid)}`);
  const a = j.activity || j;
  const d = a.data || a;
  const meta = d.metadata || {};
  const safe = {
    uid: d.uid || uid,
    type: meta.type || d.type || a.type,
    source: d.source_name || d.source || meta.source,
    created: meta.estimated_created_at || d.timestamp,
    matched: meta.matched_at,
    severity: d.risk?.score ?? meta.severity,
    our_identifiers: (d.identifiers || []).map(identName),
    credential_count: d.credential_count ?? d.credentials_count,
    infection_date: d.infection_date,
    verb: d.verb,
    domains_matched: (d.highlights && d.highlights["features.domains"]) || undefined,
    link: meta.flare_url,
  };
  if (JSON_OUT) return out(JSON.stringify(safe, null, 2).replace(/<\/?mark>/g, ""));
  const clean = (x: unknown) => String(x).replace(/<\/?mark>/g, "");
  for (const [k, v] of Object.entries(safe)) if (v !== undefined && v !== null && v !== "") out(`${k}: ${Array.isArray(v) ? v.map(clean).join(", ") : clean(v)}`);
}

function help() {
  out(`flare.ts — safe Flare exposure checks (never prints credentials)
  check                         prove the key works
  identifiers                   what is plugged in, all-time event counts
  summary [--days 7] [--type stealer_log,leak] [--max-pages 50]
  new [--since 24h|3d|ISO] [--type …] [--max-pages 50]
  lookalikes                    look-alike domains seen
  event <uid>                   one event, safe fields only
  --json on any command`);
}

(async () => {
  switch (cmd) {
    case "check": return cmdCheck();
    case "identifiers": return cmdIdentifiers();
    case "summary": return cmdSummary();
    case "new": return cmdNew();
    case "lookalikes": return cmdLookalikes();
    case "event": return cmdEvent();
    default: return help();
  }
})().catch((e) => die(`flare.ts failed: ${e?.message || e}`));
