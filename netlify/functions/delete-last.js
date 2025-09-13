import { Client } from "@notionhq/client";
const findDbByTitle = async (notion, title) => {
  const res = await notion.search({ query: title, filter: { property: "object", value: "database" }, sort: { direction: "descending", timestamp: "last_edited_time" } });
  return res.results.find(r => (r.title?.[0]?.plain_text || "") === title);
};
export async function handler(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  const token = (event.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return { statusCode: 401, body: "Missing authorization" };
  try {
    const { sessionId, pageId } = JSON.parse(event.body || "{}");
    if (!sessionId && !pageId) return { statusCode: 400, body: "Need sessionId or pageId" };
    const notion = new Client({ auth: token });
    let targetId = pageId;
    if (!targetId) {
      const db = await findDbByTitle(notion, "Time Log");
      if (!db) return { statusCode: 404, body: "Time Log DB not found" };
      const q = await notion.databases.query({ database_id: db.id, filter: { property: "Session ID", rich_text: { equals: sessionId } }, page_size: 1 });
      const page = q.results[0];
      if (!page) return { statusCode: 404, body: "Session not found" };
      targetId = page.id;
    }
    await notion.pages.update({ page_id: targetId, archived: true });
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e) {
    return { statusCode: 500, body: "Delete error: " + e.message };
  }
}