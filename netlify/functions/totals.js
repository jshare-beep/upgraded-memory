import { Client } from "@notionhq/client";
import { getDbId } from "./_common.js";

export async function handler(event) {
  const token = (event.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return { statusCode: 401, body: "Missing authorization" };
  try {
    const qs = event.queryStringParameters || {};
    const from = qs.from, to = qs.to;
    if (!from || !to) return { statusCode: 400, body: "Missing from/to" };
    const notion = new Client({ auth: token });
    const dbId = await getDbId(notion, "Time Log", "NOTION_TIMELOG_DB_ID");
    const res = await notion.databases.query({
      database_id: dbId,
      filter: { and: [{ property: "Date", date: { on_or_after: from } }, { property: "Date", date: { on_or_before: to } }] },
      page_size: 100
    });
    const days = {};
    const keyFromISO = (iso) => (iso || "").slice(0,10);
    for (const page of res.results) {
      const date = page.properties?.["Date"]?.date?.start;
      const minutes = page.properties?.["Minutes"]?.number || 0;
      const key = keyFromISO(date);
      if (!key) continue;
      if (!days[key]) days[key] = { totalMs: 0 };
      days[key].totalMs += minutes * 60000;
    }
    return { statusCode: 200, body: JSON.stringify({ days }) };
  } catch (e) { return { statusCode: 500, body: "Totals error: " + e.message }; }
}
