import { Client } from "@notionhq/client";
import { getDbId } from "./_common.js";
export async function handler(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  const token = (event.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return { statusCode: 401, body: "Missing authorization" };
  try {
    const notion = new Client({ auth: token });
    const dbId = await getDbId(notion, "Time Log", "NOTION_TIMELOG_DB_ID");
    const { sessionId, pageId } = JSON.parse(event.body || "{}");
    let targetId = pageId;
    if (!targetId && sessionId) {
      const q = await notion.databases.query({ database_id: dbId, filter: { property: "Session ID", rich_text: { equals: sessionId } }, page_size: 1 });
      targetId = q.results[0]?.id;
    }
    if (!targetId) return { statusCode: 404, body: "No matching entry found" };
    await notion.pages.update({ page_id: targetId, archived: true });
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) { return { statusCode: 500, body: "Delete error: " + e.message }; }
}
