# Spare Key's own continuity plan

Spare Key follows its own advice.

## What happens to users if this site disappears

Nothing important. Every continuity plan is a Word file the client already holds, and every inventory is a JSON file the builder already holds. Neither needs this site to be read. The format is in [FORMAT.md](FORMAT.md).

## What it runs on

| Part | Where | In whose name | Paid by | Second admin |
| --- | --- | --- | --- | --- |
| Code | GitHub, [JHarbourne/sparekey](https://github.com/JHarbourne/sparekey) (public) | Jonathan Harbourne | Free | [add a co-maintainer] |
| Build and deploy | GitHub Actions, secrets VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID | Jonathan Harbourne | Free | Whoever maintains the repository |
| Hosting (static files only) | Vercel, team “jharbourne” | Jonathan Harbourne | Vercel Pro | [add a second member] |
| Domain | sparekey.dev (GoDaddy, bought 27 Sep 2026) | Jonathan Harbourne | Jonathan Harbourne, about £12 a year | [add a GoDaddy delegate] |
| Usage counts | PostHog (EU) | Jonathan Harbourne | Free tier | [add a second member] |
| Feedback board | Nearmark website (Supabase project rzfrn…) | Jonathan Harbourne | Free tier | [add a second member] |

## If the site goes offline

Anyone can deploy their own copy from the repository with `npx vercel --prod`, or serve the files from any static host, or run `node scripts/serve.mjs` on their own computer. There is no server-side code: the lookups run in the browser.

## Stores nothing

No database, no user accounts, no server that could log which domains were looked up. There is nothing to hand over and nothing to leak.

## Contact

hello@jharbourne.com. Security reports: see [/.well-known/security.txt](.well-known/security.txt).

## Documentation

The functional specification, architecture, security, testing and release notes are in [docs/](docs/).
