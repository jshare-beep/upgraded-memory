// netlify/functions/auth-callback.js
export async function handler(event) {
  const clientId = process.env.NOTION_CLIENT_ID;
  const clientSecret = process.env.NOTION_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return { statusCode: 500, body: "Missing NOTION_CLIENT_ID/SECRET env vars" };
  }

  try {
    const redirectBase = `https://${event.headers.host}`;
    const redirectUri = `${redirectBase}/.netlify/functions/auth-callback`;

    const params = event.queryStringParameters || {};
    const code = params.code;
    const stateStr = params.state || "";
    const state = stateStr ? JSON.parse(Buffer.from(stateStr, "base64url").toString("utf8")) : {};
    const returnUrl = state.returnUrl || redirectBase;

    if (!code) return { statusCode: 400, body: "Missing code" };

    const tokenRes = await fetch("https://api.notion.com/v1/oauth/token", {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri
      })
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      return { statusCode: 500, body: "Token exchange failed: " + text };
    }

    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;

    const url = new URL(returnUrl);
    url.hash = `access_token=${encodeURIComponent(accessToken)}`;
    return { statusCode: 302, headers: { Location: url.toString() }, body: "" };
  } catch (e) {
    return { statusCode: 500, body: "Callback error: " + e.message };
  }
}
