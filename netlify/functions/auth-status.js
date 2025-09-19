// netlify/functions/auth-status.js
function parseCookies(header = "") {
  const out = {};
  header.split(";").forEach(pair => {
    const idx = pair.indexOf("=");
    if (idx > -1) {
      const k = pair.slice(0, idx).trim();
      const v = decodeURIComponent(pair.slice(idx + 1).trim());
      out[k] = v;
    }
  });
  return out;
}

exports.handler = async (event) => {
  try {
    const cookieHeader = event.headers.cookie || event.headers.Cookie || "";
    const cookies = parseCookies(cookieHeader);
    const token = cookies.notion_access_token || "";
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: !!token, reason: token ? undefined : "no_cookie" }),
    };
  } catch (e) {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, error: String(e) }),
    };
  }
};
