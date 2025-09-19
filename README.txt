Workday Timer v7.3.2

1) Upload this folder to Netlify (Deploy manually) or push to GitHub and import in Netlify.
2) In Netlify → Site configuration → Environment variables, add:
   NOTION_CLIENT_ID, NOTION_CLIENT_SECRET, NOTION_PROJECTS_DB_ID, NOTION_CLIENTS_DB_ID, NOTION_TIMELOG_DB_ID,
   WRITEBACK_PROJECT_TOTAL_PROP = Total Minutes, WRITEBACK_PROJECT_TOTAL_UNIT = minutes
3) Retry deploy without cache.
4) In Notion: open each database (Projects, Clients, Time Log) → Share → invite your integration.
5) Open /widget/ → Connect Notion → pick a Project → Go / Stop.
6) Debug env at /.netlify/functions/debug-env
