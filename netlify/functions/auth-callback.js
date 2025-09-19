function text(code,msg){return{statusCode:code,headers:{'Content-Type':'text/plain'},body:String(msg)};}
function getCookie(event,name){const c=event.headers.cookie||'';const m=c.match(new RegExp('(?:^|; )'+name+'=([^;]+)'));return m?decodeURIComponent(m[1]):null;}
export async function handler(event){
  try{
    const url = new URL(event.rawUrl || (`https://${event.headers.host}${event.path}?${event.queryStringParameters}`));
    const code = url.searchParams.get('code');
    const state= url.searchParams.get('state');
    if(!code) return text(400,'Missing code');
    const st = getCookie(event,'ntn_oauth_state');
    if(!st || st!==state) return text(400,'State mismatch');

    const proto = event.headers['x-forwarded-proto'] || 'https';
    const host  = event.headers['x-forwarded-host'] || event.headers.host;
    const origin = `${proto}://${host}`;
    const redirect = process.env.NOTION_REDIRECT_URI || `${origin}/.netlify/functions/auth-callback`;

    const id = process.env.NOTION_CLIENT_ID;
    const sec= process.env.NOTION_CLIENT_SECRET;
    if(!id||!sec) return text(500,'Missing client envs');

    const r = await fetch('https://api.notion.com/v1/oauth/token',{
      method:'POST',
      headers:{ 'Authorization': 'Basic '+Buffer.from(`${id}:${sec}`).toString('base64'), 'Content-Type':'application/json' },
      body: JSON.stringify({ grant_type:'authorization_code', code, redirect_uri: redirect })
    });
    if(!r.ok){ const t=await r.text(); return text(500,'Token exchange failed: '+t); }
    const tok = await r.json();
    const cookie = [`ntn_access_token=${encodeURIComponent(tok.access_token)}`,'Path=/','HttpOnly','SameSite=Lax','Secure', tok.expires_in?`Max-Age=${tok.expires_in}`:''].filter(Boolean).join('; ');
    return { statusCode:302, headers:{ 'Set-Cookie': cookie, 'Location':'/widget/' } };
  }catch(e){ return text(500,e.message); }
}
