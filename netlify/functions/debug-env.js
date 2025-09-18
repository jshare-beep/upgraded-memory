export async function handler() {
  const safe = (k) => (process.env[k] ? (k.includes("SECRET") ? "✅ exists" : process.env[k]) : "❌ not found");
  const keys = ["NOTION_CLIENT_ID","NOTION_CLIENT_SECRET","NOTION_PROJECTS_DB_ID","NOTION_CLIENTS_DB_ID","NOTION_TIMELOG_DB_ID","WRITEBACK_PROJECT_TOTAL_PROP","WRITEBACK_PROJECT_TOTAL_UNIT"];
  const out = {}; keys.forEach(k => out[k]=safe(k));
  return { statusCode: 200, headers: { "Content-Type":"application/json" }, body: JSON.stringify(out, null, 2) };
}
