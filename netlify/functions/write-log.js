
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
  const cfg = JSON.parse(event.body || "{}");
  const timelog = process.env.NOTION_TIMELOG_DB_ID;
  if (!timelog) return { statusCode: 500, body: "TIMELOG DB not set or not discoverable" };

  const page = await notionFetch(token, "/pages", {
    method: "POST",
    body: JSON.stringify({
      parent: { database_id: timelog },
      properties: {
        Date: { date: { start: cfg.date } },
        Minutes: { number: cfg.minutes },
        Project: cfg.project_id ? { relation: [{ id: cfg.project_id }] } : undefined,
        Client: cfg.client_id ? { relation: [{ id: cfg.client_id }] } : undefined,
        Source: { rich_text: [{ type:"text", text:{ content: "Widget" } }] },
        "Session ID": cfg.session_id ? { rich_text: [{ type:"text", text:{ content: cfg.session_id } }] } : undefined
      }
    })
  });

  // Optional writeback to Project totals
  const prop = process.env.WRITEBACK_PROJECT_TOTAL_PROP;
  const unit = (process.env.WRITEBACK_PROJECT_TOTAL_UNIT || "minutes").toLowerCase();
  if (prop && cfg.project_id) {
    try {
      // Load current value
      const current = await notionFetch(token, `/pages/${cfg.project_id}`);
      const props = current.properties || {};
      let cur = 0;
      if (props[prop]) {
        if (props[prop].number != null) cur = props[prop].number;
        else if (props[prop].formula?.number != null) cur = props[prop].formula.number;
      }
      const add = unit === "hours" ? (cfg.minutes/60) : cfg.minutes;
      await notionFetch(token, `/pages/${cfg.project_id}`, {
        method:"PATCH",
        body: JSON.stringify({ properties: { [prop]: { number: (cur + add) } } })
      });
    } catch {}
  }

  return { statusCode: 200, headers: {"content-type":"application/json"}, body: JSON.stringify({ ok:true, id: page.id }) };
}
