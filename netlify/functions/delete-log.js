export async function handler(event){
  try{
    if(event.httpMethod!=='POST') return json(405,{error:'method'});
    const token=getCookie(event,'ntn_access_token'); if(!token) return json(401,{error:'unauthorized'});
    const {logId}=JSON.parse(event.body||'{}'); if(!logId) return json(400,{error:'logId required'});
    const r=await fetch(`${API}/pages/${logId}`,{method:'PATCH',headers:H(token),body:JSON.stringify({archived:true})});
    if(!r.ok){const t=await r.text();throw new Error(`Delete failed: ${t}`);}
    return json(200,{ok:true});
  }catch(e){return json(500,{error:e.message});}
}
const API='https://api.notion.com/v1'; 
const H=(t)=>({'Authorization':`Bearer ${t}`,'Notion-Version':'2022-06-28','Content-Type':'application/json'});
function getCookie(e,n){const c=e.headers.cookie||'';const m=c.match(new RegExp('(?:^|; )'+n+'=([^;]+)'));return m?decodeURIComponent(m[1]):null;}
function json(c,o){return{statusCode:c,headers:{'Content-Type':'application/json'},body:JSON.stringify(o)};}
