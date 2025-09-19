export async function handler(){
  const e=process.env;
  const safe={
    NOTION_CLIENT_ID: e.NOTION_CLIENT_ID || null,
    NOTION_CLIENT_SECRET: e.NOTION_CLIENT_SECRET ? 'exists' : null,
    NOTION_PROJECTS_DB_ID: e.NOTION_PROJECTS_DB_ID || null,
    NOTION_CLIENTS_DB_ID: e.NOTION_CLIENTS_DB_ID || null,
    NOTION_TIMELOG_DB_ID: e.NOTION_TIMELOG_DB_ID || null,
    WRITEBACK_PROJECT_TOTAL_PROP: e.WRITEBACK_PROJECT_TOTAL_PROP || null,
    WRITEBACK_PROJECT_TOTAL_UNIT: e.WRITEBACK_PROJECT_TOTAL_UNIT || 'minutes'
  };
  return{statusCode:200,headers:{'Content-Type':'application/json'},body:JSON.stringify(safe,null,2)};
}
