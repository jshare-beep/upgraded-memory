
export function getEnv() {
  const required = [
    "NOTION_CLIENT_ID",
    "NOTION_CLIENT_SECRET"
  ];
  const env = {};
  for (const k in process.env) env[k] = process.env[k];
  return { env, required };
}
