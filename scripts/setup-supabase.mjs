import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv(file) {
  try {
    const text = readFileSync(resolve(file), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional file
  }
}

loadEnv(".env");
loadEnv(".env.local");

const url = process.env.VITE_SUPABASE_URL;
const publishable = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const secret = process.env.SUPABASE_SECRET_KEY;
const adminEmail = (process.env.ADMIN_EMAIL || "sih@gtmcnanded.in").toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || "SihGtmc2026!";
const ref = new URL(url).hostname.split(".")[0];

if (!url || !secret) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SECRET_KEY");
  process.exit(1);
}

async function runSql(sql) {
  const endpoints = [
    `https://api.supabase.com/v1/projects/${ref}/database/query`,
    `${url}/pg/query`,
    `${url}/pg-meta/default/query`,
  ];
  const headers = {
    "Content-Type": "application/json",
    apikey: secret,
    Authorization: `Bearer ${secret}`,
  };
  let lastError = "No SQL endpoint accepted the schema.";
  for (const endpoint of endpoints) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: sql }),
    });
    const text = await response.text();
    if (response.ok) {
      console.log(`Schema applied via ${endpoint}`);
      return true;
    }
    lastError = `${endpoint} → ${response.status} ${text.slice(0, 240)}`;
    console.warn(lastError);
  }
  return lastError;
}

async function main() {
  const sql = readFileSync(resolve("supabase/schema.sql"), "utf8");
  const sqlResult = await runSql(sql);
  if (sqlResult !== true) {
    console.warn("\nCould not apply SQL automatically. Paste supabase/schema.sql in the Supabase SQL editor, then re-run: node scripts/setup-supabase.mjs\n");
  }

  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

  const problems = JSON.parse(readFileSync(resolve("src/data/problem-statements.json"), "utf8"));
  const rows = problems.map((item, index) => ({
    id: item.id,
    code: item.code || item.id,
    title: item.title,
    organization: item.organization || "",
    category: item.category || "Software",
    theme: item.theme || "",
    difficulty: item.difficulty || "Medium",
    description: item.description || "",
    background: item.background || "",
    expected_solution: item.expectedSolution || "",
    technical_requirements: item.technicalRequirements || [],
    technologies: item.technologies || [],
    constraint_items: item.constraints || [],
    evaluation_criteria: item.evaluationCriteria || [],
    selected_count: item.selectedCount || 0,
    max_selections: item.maxSelections || 2,
    status: item.status || "AVAILABLE",
    sort_order: item.sortOrder || index + 1,
  }));

  const { error: seedError } = await admin.from("problems").upsert(rows, { onConflict: "id" });
  if (seedError) {
    console.warn("Problem seed:", seedError.message);
  } else {
    console.log(`Seeded ${rows.length} problem statements`);
  }

  const userResponse = await fetch(`${url}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: secret,
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { name: "SIH Admin" },
    }),
  });
  const userPayload = await userResponse.json();
  let adminId = userPayload?.id;
  if (!adminId) {
    const list = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=50`, {
      headers: { apikey: secret, Authorization: `Bearer ${secret}` },
    });
    const listed = await list.json();
    const existing = (listed.users || listed || []).find((item) => String(item.email || "").toLowerCase() === adminEmail);
    adminId = existing?.id;
    if (adminId) console.log("Admin auth user already exists");
    else console.warn("Admin user create:", JSON.stringify(userPayload).slice(0, 400));
  } else {
    console.log("Created admin auth user");
  }

  if (adminId) {
    const { error } = await admin.from("admins").upsert({
      id: adminId,
      email: adminEmail,
      name: "SIH Admin",
      role: "ADMIN",
    });
    if (error) console.warn("Admin row:", error.message);
    else console.log(`Admin ready: ${adminEmail}`);
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
