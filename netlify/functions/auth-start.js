
export async function handler(event) {
  const client_id = process.env.NOTION_CLIENT_ID;
  if (!client_id) return { statusCode: 500, body: "Missing NOTION_CLIENT_ID" };
  const returnUrl = (event.queryStringParameters && event.queryStringParameters.return) || "/widget/";
  const redirect_uri = new URL("/.netlify/functions/auth-callback", `https://${event.headers.host}`).toString();
  const url = new URL("https://api.notion.com/v1/oauth/authorize");
  url.searchParams.set("client_id", client_id);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("owner", "user");
  url.searchParams.set("redirect_uri", redirect_uri);
  url.searchParams.set("state", returnUrl);
  return { statusCode: 302, headers: { Location: url.toString() }};
}
