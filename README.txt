Workday Timer v7.6.0-r3

Upload this entire ZIP to Netlify (Deploys → Upload deploy). Then:
1) Add env vars in Site configuration → Environment variables (exact names):
   NOTION_CLIENT_ID
   NOTION_CLIENT_SECRET
   NOTION_PROJECTS_DB_ID
   NOTION_CLIENTS_DB_ID
   NOTION_TIMELOG_DB_ID
   (optional) WRITEBACK_PROJECT_TOTAL_PROP = Total Minutes
   (optional) WRITEBACK_PROJECT_TOTAL_UNIT = minutes
   (optional) NOTION_REDIRECT_URI = https://YOUR-SITE.netlify.app/.netlify/functions/auth-callback
2) Deploys → Options → Retry deploy without cache.
3) In Notion: open Projects, Clients, Time Log → Share → invite your integration.
4) Open /widget/ → Connect Notion → approve.
5) Checks:
   /.netlify/functions/debug-env
   /.netlify/functions/auth-status
   /.netlify/functions/lists
