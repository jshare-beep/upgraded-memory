export async function handler(event){
  try{
    const token=getCookie(event,'ntn_access_token');
    if(!token) return json(401,{error:'unauthorized'});
    const {projectsDbId,clientsDbId,timeLogDbId}=await getDbIds(token);
    const list=await notionQueryDatabase(token,projectsDbId,{page_size:100});
    const projects=(list.results||[]).map(p=>({id:p.id,title:titleOf(p)}));
    return json(200,{projectsDbId,clientsDbId,timeLogDbId,projects});
  }catch(e){return json(500,{error:e.message});}
}
const API='https://api.notion.com/v1';
const H=(t)=>({'Authorization':`Bearer ${t}`,'Notion-Version':'2022-06-28','Content-Type':'application/json'});
function titleOf(page){const p=page.properties;const key=Object.keys(p).find(k=>p[k].type==='title')||'Name';const arr=(p[key]?.title)||[];return arr.map(r=>r.plain_text).join('')||'(Untitled)';}
async function notionQueryDatabase(token,dbId,body){const r=await fetch(`${API}/databases/${dbId}/query`,{method:'POST',headers:H(token),body:JSON.stringify(body||{})});if(!r.ok)throw new Error('Notion query failed');return r.json();}
function getCookie(e,n){const c=e.headers.cookie||'';const m=c.match(new RegExp('(?:^|; )'+n+'=([^;]+)'));return m?decodeURIComponent(m[1]):null;}
function json(code,obj){return{statusCode:code,headers:{'Content-Type':'application/json'},body:JSON.stringify(obj)};}
async function getDbIds(token){
  const env=process.env;
  let p=env.NOTION_PROJECTS_DB_ID||null;
  let c=env.NOTION_CLIENTS_DB_ID||null;
  let t=env.NOTION_TIMELOG_DB_ID||null;
  if(!p) p=await findDbIdByTitle(token,'Projects');
  if(!c) c=await findDbIdByTitle(token,'Clients');
  if(!t) t=await findDbIdByTitle(token,'Time Log');
  return {projectsDbId:p,clientsDbId:c,timeLogDbId:t};
}
async function findDbIdByTitle(token,title){
  const r=await fetch(`${API}/search`,{method:'POST',headers:H(token),body:JSON.stringify({query:title,filter:{property:'object',value:'database'}})});
  const j=await r.json(); const hit=(j.results||[]).find(d=>(d.title||[]).some(t=>t.plain_text.trim()===title));
  if(!hit) throw new Error(`Database "${title}" not found`); return hit.id;
}
