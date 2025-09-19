
import fetch from 'node-fetch';

function bearer(headers) {
  const h = headers.authorization || headers.Authorization || "";
  const m = /^Bearer\s+(.+)/i.exec(h);
  return m && m[1];
}

async function notionFetch(token, path, opts={}) {
  const base = "https://api.notion.com/v1";
  const r = await fetch(base + path, {
    ...opts,
    headers: {
      "Authorization": "Bearer " + token,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
      ...(opts.headers || {})
    }
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function handler(event) {
  const token = bearer(event.headers || {});
  if (!token) return { statusCode: 401, body: "Missing Bearer token" };

  // Find DBs by ID or by title
  const want = {
    projects: process.env.NOTION_PROJECTS_DB_ID,
    clients: process.env.NOTION_CLIENTS_DB_ID,
    timelog: process.env.NOTION_TIMELOG_DB_ID
  };

  // Helper: search title exact match
  async function findByTitle(title) {
    const search = await notionFetch(token, "/search", {
      method:"POST",
      body: JSON.stringify({ query: title, filter: { value:"database", property:"object" }})
    });
    const exact = (search.results || []).find(x => x.object==="database" && x.title && x.title[0] && x.title[0].plain_text===title);
    return exact && exact.id;
  }

  if (!want.projects) want.projects = await findByTitle("Projects");
  if (!want.clients) want.clients = await findByTitle("Clients");
  if (!want.timelog) want.timelog = await findByTitle("Time Log");

  // Load a short list of projects
  let projectsList = [];
  if (want.projects) {
    const q = await notionFetch(token, `/databases/${want.projects}/query`, { method:"POST", body: JSON.stringify({ page_size: 50 }) });
    projectsList = (q.results || []).map(p => {
      const title = (p.properties.Project?.title?.[0]?.plain_text) || (p.properties.Name?.title?.[0]?.plain_text) || "Untitled";
      return { id: p.id, title };
    });
  }

  return {
    statusCode: 200,
    headers: {"content-type":"application/json"},
    body: JSON.stringify({ db: want, projects: projectsList }, null, 2)
  };
}
