export async function findDbByTitle(notion, title) {
  const res = await notion.search({ query: title, filter: { property: "object", value: "database" }, sort: { direction: "descending", timestamp: "last_edited_time" } });
  const db = res.results.find(r => (r.title?.[0]?.plain_text || "") === title);
  return db?.id || null;
}
export async function getDbId(notion, fallbackTitle, envVar) {
  const id = process.env[envVar];
  if (id) return id;
  const byTitle = await findDbByTitle(notion, fallbackTitle);
  if (!byTitle) throw new Error(fallbackTitle + " DB not found (set " + envVar + ")");
  return byTitle;
}
export async function getTitlePropName(notion, database_id) {
  const db = await notion.databases.retrieve({ database_id });
  for (const [name, def] of Object.entries(db.properties||{})) {
    if (def.type === "title") return name;
  }
  throw new Error("No title property on DB "+database_id);
}
export async function getClientRelProp(notion, projectsDbId, clientsDbId) {
  const db = await notion.databases.retrieve({ database_id: projectsDbId });
  // exact match
  for (const [name, def] of Object.entries(db.properties||{})) {
    if (def.type === "relation" && def.relation?.database_id === clientsDbId) return name;
  }
  // common names fallback
  if (db.properties["Client"]?.type === "relation") return "Client";
  if (db.properties["Clients"]?.type === "relation") return "Clients";
  throw new Error("Projects DB has no relation to Clients DB");
}
export async function sumMinutesForProject(notion, timeLogDbId, projectPageId) {
  // Query all pages in Time Log where Project relation contains projectPageId; sum Minutes
  let cursor = undefined, total = 0;
  do {
    const res = await notion.databases.query({
      database_id: timeLogDbId,
      start_cursor: cursor,
      page_size: 100,
      filter: { property: "Project", relation: { contains: projectPageId } }
    });
    for (const page of res.results) {
      total += page.properties?.["Minutes"]?.number || 0;
    }
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);
  return total;
}
