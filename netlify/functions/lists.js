import { Client } from "@notionhq/client";
async function getDb(notion, fallbackTitle, envVar) {
  const id = process.env[envVar];
  if (id) return { id };
  const res = await notion.search({ query: fallbackTitle, filter: { property: "object", value: "database" }, sort: { direction: "descending", timestamp: "last_edited_time" } });
  const db = res.results.find(r => (r.title?.[0]?.plain_text || "") === fallbackTitle);
  if (!db) throw new Error(fallbackTitle + " DB not found");
  return { id: db.id };
}
export async function handler(event) {
  const token = (event.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return { statusCode: 401, body: "Missing authorization" };
  try {
    const notion = new Client({ auth: token });
    const projectsDb = await getDb(notion, "Projects", "NOTION_PROJECTS_DB_ID");
    const clientsDb = await getDb(notion, "Clients", "NOTION_CLIENTS_DB_ID");
    // Build client map
    const clientMap = new Map();
    let cCursor = undefined;
    do {
      const res = await notion.databases.query({ database_id: clientsDb.id, start_cursor: cCursor, page_size: 100 });
      for (const page of res.results) {
        const name = page.properties?.Name?.title?.[0]?.plain_text || "";
        if (name) clientMap.set(page.id, name);
      }
      cCursor = res.has_more ? res.next_cursor : undefined;
    } while (cCursor);
    // Projects
    const projects = [];
    let pCursor = undefined;
    do {
      const res = await notion.databases.query({ database_id: projectsDb.id, start_cursor: pCursor, page_size: 100, sorts: [{ timestamp: "last_edited_time", direction: "descending" }]});
      for (const page of res.results) {
        const name = page.properties?.Name?.title?.[0]?.plain_text || "";
        if (!name) continue;
        const rel = page.properties?.Client?.relation || [];
        const clientId = rel[0]?.id || null;
        const clientName = clientId ? (clientMap.get(clientId) || "") : "";
        projects.push({ id: page.id, name, clientId, clientName });
      }
      pCursor = res.has_more ? res.next_cursor : undefined;
    } while (pCursor);
    // Deduplicate by lowercase name (keep most recent)
    const seen = new Set();
    const unique = [];
    for (const p of projects) {
      const k = p.name.trim().toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k); unique.push(p);
    }
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projects: unique }) };
  } catch (e) { return { statusCode: 500, body: "Lists error: " + e.message }; }
}
