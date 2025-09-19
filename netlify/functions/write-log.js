export async function handler(event){
  try{
    if(event.httpMethod!=='POST') return json(405,{error:'method'});
    const token=getCookie(event,'ntn_access_token'); if(!token) return json(401,{error:'unauthorized'});
    const {minutes,projectId,date}=JSON.parse(event.body||'{}'); if(!minutes||!projectId) return json(400,{error:'minutes/projectId required'});
    const {timeLogDbId}=await getDbIds();

    const create=await fetch(`${API}/pages`,{
      method:'POST',
      headers:H(token),
      body:JSON.stringify({
        parent:{database_id:timeLogDbId},
        properties:{
          "Minutes":{number:minutes},
          "Date":{date:{start:(date||new Date().toISOString())}},
          "Project":{relation:[{id:projectId}]},
          "Source":{rich_text:[{text:{content:'Widget'}}]}
        }
      })
    });
    if(!create.ok){const t=await create.text();throw new Error(`Notion create failed: ${t}`);} 
    const page=await create.json();

    const propName=process.env.WRITEBACK_PROJECT_TOTAL_PROP; 
    const unit=(process.env.WRITEBACK_PROJECT_TOTAL_UNIT||'minutes').toLowerCase();
    if(propName){
      const pg=await fetch(`${API}/pages/${projectId}`,{headers:H(token)}); 
      const pj=await pg.json(); 
      const cur=pj.properties?.[propName]?.number||0; 
      const add=(unit==='hours')?(minutes/60):minutes;
      await fetch(`${API}/pages/${projectId}`,{
        method:'PATCH',
        headers:H(token),
        body:JSON.stringify({properties:{[propName]:{number:cur+add}}})
      });
    }
    return json(200,{ok:true,logId:page.id,minutes});
  }catch(e){return json(500,{error:e.message});}
}
const API='https://api.notion.com/v1'; 
const H=(t)=>({'Authorization':`Bearer ${t}`,'Notion-Version':'2022-06-28','Content-Type':'application/json'});
function getCookie(e,n){const c=e.headers.cookie||'';const m=c.match(new RegExp('(?:^|; )'+n+'=([^;]+)'));return m?decodeURIComponent(m[1]):null;}
function json(c,o){return{statusCode:c,headers:{'Content-Type':'application/json'},body:JSON.stringify(o)};}
async function getDbIds(){return{timeLogDbId:process.env.NOTION_TIMELOG_DB_ID};}
