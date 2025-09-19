export async function handler(event){
  try{
    const proto = event.headers['x-forwarded-proto'] || 'https';
    const host  = event.headers['x-forwarded-host'] || event.headers.host;
    const origin = `${proto}://${host}`;
    const redirect = process.env.NOTION_REDIRECT_URI || `${origin}/.netlify/functions/auth-callback`;
    const clientId = process.env.NOTION_CLIENT_ID;
    if(!clientId) return res(500,'Missing NOTION_CLIENT_ID');
    const state = Math.random().toString(36).slice(2);
    const params = new URLSearchParams({ client_id:clientId, response_type:'code', owner:'user', redirect_uri:redirect, state });
    return { statusCode:302, headers:{ 'Location': `https://api.notion.com/v1/oauth/authorize?${params}`, 'Set-Cookie': `ntn_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Secure` } };
  }catch(e){ return res(500,e.message); }
}
function res(code,body){return{statusCode:code,headers:{'Content-Type':'text/plain'},body:String(body)}}
