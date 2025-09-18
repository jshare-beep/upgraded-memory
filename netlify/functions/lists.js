import { Client } from "@notionhq/client";
import { getDbId, getTitlePropName, getClientRelProp } from "./_common.js";

export async function handler(event) {
  const token = (event.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return { statusCode: 401, body: "Missing authorization" };
  try {
    const notion = new Client({ auth: token });
    const projectsDbId = await getDbId(notion, "Projects", "NOTION_PROJECTS_DB_ID");
    const clientsDbId  = await getDbId(notion, "Clients", "NOTION_CLIENTS_DB_ID");
    const titleProp = await getTitlePropName(notion, projectsDbId);
    const clientRelProp = await getClientRelProp(notion, projectsDbId, clientsDbId);

    const projects = [];
    let cursor = undefined;
    do {
      const res = await notion.databases.query({
        database_id: projectsDbId,
        start_cursor: cursor,
        page_size: 100,
        sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
      });
      for (const page of res.results) {
        const name = page.properties?.[titleProp]?.title?.[0]?.plain_text || "";
        if (!name) continue;
        const rel = page.properties?.[clientRelProp]?.relation || [];
        const clientId = rel[0]?.id || null;
        let clientName = "";
        if (clientId) {
          const cp = await notion.pages.retrieve({ page_id: clientId });
          clientName = cp.properties?.Name?.title?.[0]?.plain_text || "";
        }
        projects.push({ id: page.id, name, clientId, clientName });
      }
      cursor = res.has_more ? res.next_cursor : undefined;
    } while (cursor);

    const seen = new Set(); const unique = [];
    for (const p of projects) {
      const k = p.name.trim().toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k); unique.push(p);
    }
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projects: unique }) };
  } catch (e) { return { statusCode: 500, body: "Lists error: " + e.message }; }
}
