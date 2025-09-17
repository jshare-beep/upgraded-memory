import { Client } from "@notionhq/client";
import { getDbId, sumMinutesForProject } from "./_common.js";

export async function handler(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  const token = (event.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return { statusCode: 401, body: "Missing authorization" };
  try {
    const body = JSON.parse(event.body || "{}");
    const { start, end, clientId, projectId, note, sessionId } = body;
    if (!start || !end || !projectId) return { statusCode: 400, body: "Missing fields" };

    const notion = new Client({ auth: token });
    const timeLogDbId  = await getDbId(notion, "Time Log", "NOTION_TIMELOG_DB_ID");

    const minutes = Math.max(0, Math.round((new Date(end) - new Date(start)) / 60000));

    const created = await notion.pages.create({
      parent: { database_id: timeLogDbId },
      properties: {
        "Date": { date: { start } },
        "Minutes": { number: minutes },
        "Client": clientId ? { relation: [{ id: clientId }] } : undefined,
        "Project": { relation: [{ id: projectId }] },
        "Note": note ? { rich_text: [{ type: "text", text: { content: note } }] } : undefined,
        "Source": { select: { name: "Widget" } },
        "Session ID": sessionId ? { rich_text: [{ type: "text", text: { content: sessionId } }] } : undefined
      }
    });

    // Optional write-back to Projects: set a numeric prop to the total minutes (or hours) so far.
    const writeProp = process.env.WRITEBACK_PROJECT_TOTAL_PROP; // e.g., "Time Logged"
    if (writeProp) {
      const unit = (process.env.WRITEBACK_PROJECT_TOTAL_UNIT || "minutes").toLowerCase(); // "minutes" | "hours"
      const totalMin = await sumMinutesForProject(notion, timeLogDbId, projectId);
      const value = unit === "hours" ? (totalMin/60) : totalMin;
      await notion.pages.update({ page_id: projectId, properties: { [writeProp]: { number: value } } });
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, pageId: created.id }) };
  } catch (e) { return { statusCode: 500, body: "Log error: " + e.message }; }
}
