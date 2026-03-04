import fs from "node:fs";
import { parse } from "dotenv";

function loadEnv() {
  const env = { ...process.env };
  if (fs.existsSync(".env")) {
    Object.assign(env, parse(fs.readFileSync(".env", "utf8")));
  }
  return env;
}

function summarizeBy(items, getKey) {
  const map = new Map();
  for (const item of items) {
    const key = getKey(item) ?? "unknown";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
}

async function main() {
  const env = loadEnv();
  const token = env.SENTRY_AUTH_TOKEN;
  const org = env.SENTRY_ORG || "sayan-l3";
  const project = env.SENTRY_PROJECT || "javascript-nextjs";

  if (!token) {
    throw new Error("Missing SENTRY_AUTH_TOKEN");
  }

  const headers = { Authorization: `Bearer ${token}` };
  const eventsUrl = `https://sentry.io/api/0/projects/${org}/${project}/events/?statsPeriod=7d&per_page=100`;
  const rulesUrl = `https://sentry.io/api/0/projects/${org}/${project}/rules/`;

  const [eventsRes, rulesRes] = await Promise.all([
    fetch(eventsUrl, { headers }),
    fetch(rulesUrl, { headers }),
  ]);

  if (!eventsRes.ok) {
    throw new Error(`Events API failed (${eventsRes.status})`);
  }
  if (!rulesRes.ok) {
    throw new Error(`Rules API failed (${rulesRes.status})`);
  }

  const events = await eventsRes.json();
  const rules = await rulesRes.json();

  const levelSummary = summarizeBy(events, (event) => event.level ?? "unknown");
  const titleSummary = summarizeBy(events, (event) => event.title ?? event.message ?? "unknown").slice(0, 10);
  const paymentFailures = events.filter((event) => String(event.message ?? "").startsWith("payment_failure:"));

  console.log("Sentry Weekly Check");
  console.log("==================");
  console.log(`Org: ${org}`);
  console.log(`Project: ${project}`);
  console.log(`Events (7d): ${events.length}`);
  console.log(`Payment Failure Events (7d): ${paymentFailures.length}`);
  console.log("");
  console.log("Events by Level:");
  for (const [level, count] of levelSummary) {
    console.log(`- ${level}: ${count}`);
  }
  console.log("");
  console.log("Top Events:");
  for (const [title, count] of titleSummary) {
    console.log(`- ${count}x ${title}`);
  }
  console.log("");
  console.log("Alert Rules:");
  for (const rule of rules) {
    const status = rule.status ?? "active";
    console.log(`- [${status}] ${rule.name} (id: ${rule.id})`);
  }
}

main().catch((error) => {
  console.error("[sentry-weekly-check] failed", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
