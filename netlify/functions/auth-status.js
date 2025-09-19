// netlify/functions/auth-status.js
function parseCookies(header = "") {
  const out = {};
  header.split(";").forEach(pair => {
    const i = pair.indexOf("=");
    if (i > -1) out[pair.slice(0, i).trim()] = decodeURIComponent(pair.slice(i + 1).trim());
  });
  return out;
}
export async function handler(event){
  const cookies = parseCookies(event.headers.cookie || event.headers.Cookie || "");
  const token = cookies.ntn_access_token || "";
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: !!token, reason: token ? undefined : "no_cookie" })
  };
}
