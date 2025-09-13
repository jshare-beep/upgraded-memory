import { Client } from "@notionhq/client";
const ensureHomePage = async (notion) => {
  const search = await notion.search({ query: "Workday Timer (Home)", filter: { property: "object", value: "page" }, sort: { direction: "descending", timestamp: "last_edited_time" } });
  const found = search.results.find(r => r.object === "page" && r.properties?.title);
  if (found) return found.id;
  const page = await notion.pages.create({ parent: { type: "workspace", workspace: true }, properties: { title: { title: [{ type: "text", text: { content: "Workday Timer (Home)" } }] } } });
  return page.id;
};
const ensureDatabases = async (notion, homeId) => {
  const dbs = {};
  const search = await notion.search({ query: "Clients Projects Time Log", filter: { property: "object", value: "database" }, sort: { direction: "descending", timestamp: "last_edited_time" } });
  for (const r of search.results) { const title = r.title?.[0]?.plain_text || ""; if (title === "Clients") dbs.clients = r; if (title === "Projects") dbs.projects = r; if (title === "Time Log") dbs.timeLog = r; }
  if (!dbs.clients) { dbs.clients = await notion.databases.create({ parent: { type: "page_id", page_id: homeId }, title: [{ type: "text", text: { content: "Clients" } }], properties: { "Name": { title: {} }, "URL": { url: {} } } }); }
  if (!dbs.projects) { dbs.projects = await notion.databases.create({ parent: { type: "page_id", page_id: homeId }, title: [{ type: "text", text: { content: "Projects" } }], properties: { "Name": { title: {} }, "Client": { relation: { database_id: dbs.clients.id, single_property: true } } } }); }
  if (!dbs.timeLog) { dbs.timeLog = await notion.databases.create({ parent: { type: "page_id", page_id: homeId }, title: [{ type: "text", text: { content: "Time Log" } }], properties: { "Date": { date: {} }, "Minutes": { number: {} }, "Client": { relation: { database_id: dbs.clients.id, single_property: true } }, "Project": { relation: { database_id: dbs.projects.id, single_property: true } }, "Note": { rich_text: {} }, "Source": { select: { options: [{ name: "Widget", color: "blue" }, { name: "Manual", color: "gray" }] } }, "Session ID": { rich_text: {} } } }); }
  return { clients: dbs.clients.id, projects: dbs.projects.id, timeLog: dbs.timeLog.id };
};
const findByTitle = async (notion, database_id, name) => { const res = await notion.databases.query({ database_id, filter: { property: "Name", title: { equals: name } }, page_size: 1 }); return res.results[0]; };
const createClient = async (notion, dbId, name, url="") => { return await notion.pages.create({ parent: { database_id: dbId }, properties: { "Name": { title: [{ type: "text", text: { content: name } }] }, "URL": url ? { url } : undefined } }); };
const createProject = async (notion, dbId, name, clientPageId) => { return await notion.pages.create({ parent: { database_id: dbId }, properties: { "Name": { title: [{ type: "text", text: { content: name } }] }, "Client": { relation: [{ id: clientPageId }] } } }); };
export async function handler(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  const token = (event.headers.authorization || "").replace(/^Bearer\s+/i, ""); if (!token) return { statusCode: 401, body: "Missing authorization" };
  try {
    const body = JSON.parse(event.body || "{}"); const { start, end, client, project, note, sessionId } = body;
    if (!start || !end || !client || !project) return { statusCode: 400, body: "Missing fields" };
    const notion = new Client({ auth: token }); const homeId = await ensureHomePage(notion); const dbIds = await ensureDatabases(notion, homeId);
    let c = await findByTitle(notion, dbIds.clients, client); if (!c) c = await createClient(notion, dbIds.clients, client); const clientId = c.id;
    let p = await findByTitle(notion, dbIds.projects, project); if (!p) p = await createProject(notion, dbIds.projects, project, clientId); const projectId = p.id;
    const minutes = Math.max(0, Math.round((new Date(end) - new Date(start)) / 60000));
    const created = await notion.pages.create({ parent: { database_id: dbIds.timeLog }, properties: { "Date": { date: { start } }, "Minutes": { number: minutes }, "Client": { relation: [{ id: clientId }] }, "Project": { relation: [{ id: projectId }] }, "Note": note ? { rich_text: [{ type: "text", text: { content: note } }] } : undefined, "Source": { select: { name: "Widget" } }, "Session ID": sessionId ? { rich_text: [{ type: "text", text: { content: sessionId } }] } : undefined } });
    return { statusCode: 200, body: JSON.stringify({ ok: true, pageId: created.id }) };
  } catch (e) { return { statusCode: 500, body: "Log error: " + e.message }; }
}