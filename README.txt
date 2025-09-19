Workday Timer v7.5.1

Deploy (manual):
1) Netlify → Deploys → Upload this ZIP.
2) Add env vars in Site configuration → Environment variables:
   NOTION_CLIENT_ID
   NOTION_CLIENT_SECRET
   NOTION_PROJECTS_DB_ID
   NOTION_CLIENTS_DB_ID
   NOTION_TIMELOG_DB_ID
   (optional) WRITEBACK_PROJECT_TOTAL_PROP = Total Minutes
   (optional) WRITEBACK_PROJECT_TOTAL_UNIT = minutes
   (optional) NOTION_REDIRECT_URI = https://YOUR-SITE.netlify.app/.netlify/functions/auth-callback
3) Deploys → Options → Retry deploy without cache.
4) In Notion: open Projects, Clients, Time Log → Share → invite the integration.
5) Open /widget/ → Connect Notion → approve.
6) Checks:
   /.netlify/functions/debug-env
   /.netlify/functions/auth-status
   /.netlify/functions/lists
