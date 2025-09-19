
export async function handler() {
  const keys = [
    "NOTION_CLIENT_ID",
    "NOTION_CLIENT_SECRET",
    "NOTION_PROJECTS_DB_ID",
    "NOTION_CLIENTS_DB_ID",
    "NOTION_TIMELOG_DB_ID",
    "WRITEBACK_PROJECT_TOTAL_PROP",
    "WRITEBACK_PROJECT_TOTAL_UNIT"
  ];
  const out = {};
  for (const k of keys) {
    const v = process.env[k];
    out[k] = (k === "NOTION_CLIENT_SECRET") ? (v ? "✅ exists" : "❌ missing") : (v || "");
  }
  return { statusCode: 200, headers: {"content-type":"application/json"}, body: JSON.stringify(out, null, 2) };
}
