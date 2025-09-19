
import fetch from 'node-fetch';

export async function handler(event) {
  const { queryStringParameters, headers } = event;
  const code = queryStringParameters && queryStringParameters.code;
  const state = queryStringParameters && queryStringParameters.state || "/widget/";
  if (!code) return { statusCode: 400, body: "Missing code" };
  const redirect_uri = new URL("/.netlify/functions/auth-callback", `https://${headers.host}`).toString();
  const body = {
    grant_type: "authorization_code",
    code,
    redirect_uri
  };
  const r = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Basic " + Buffer.from(process.env.NOTION_CLIENT_ID + ":" + process.env.NOTION_CLIENT_SECRET).toString("base64")
    },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const t = await r.text();
    return { statusCode: 500, body: "Token exchange failed: " + t };
  }
  const token = await r.json();
  // return HTML that stores token in localStorage and redirects back
  const html = `<!doctype html><meta charset="utf-8"><title>Connecting…</title>
  <script>
    try {
      localStorage.setItem("workday_timer_token", ${JSON.stringify(JSON.stringify(token))});
    } catch(e) {}
    location.href = ${JSON.stringify(state)};
  </script>
  Connecting…`;
  return { statusCode: 200, headers: {"content-type":"text/html"}, body: html };
}
