export async function handler(event) {
  const clientId = process.env.NOTION_CLIENT_ID;
  if (!clientId) return { statusCode: 500, body: "Missing NOTION_CLIENT_ID env var" };
  const redirectBase = `https://${event.headers.host}`;
  const redirectUri = `${redirectBase}/.netlify/functions/auth-callback`;
  const returnUrl = (event.queryStringParameters && event.queryStringParameters.return) || (event.headers.referer || redirectBase);
  const state = Buffer.from(JSON.stringify({ returnUrl })).toString('base64url');
  const params = new URLSearchParams({ client_id: clientId, response_type: "code", owner: "user", redirect_uri: redirectUri, state });
  const url = `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;
  return { statusCode: 302, headers: { Location: url }, body: "" };
}