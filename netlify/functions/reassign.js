import { Client } from "@notionhq/client";
export async function handler(event) { return { statusCode: 405, body: "Disabled in nocreate mode (use widget-selected project only)" }; }