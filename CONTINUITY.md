# If Jonathan can't carry on: Spare Key itself

Spare Key follows its own advice.

## What happens to users if this site disappears

Nothing important. Every handover document is a Word file the client already holds, and every inventory is a JSON file the builder already holds. Neither needs this site to be read. The format is in [FORMAT.md](FORMAT.md).

## What it runs on

| Part | Where | In whose name | Paid by | Second admin |
| --- | --- | --- | --- | --- |
| Code | GitHub repository [to create] | Jonathan Harbourne | Free | [add a co-maintainer] |
| Hosting (static files only) | Vercel, team “jharbourne” | Jonathan Harbourne | Vercel Pro | [add a second member] |
| Domain | sparekey.dev (GoDaddy, bought 27 Sep 2026) | Jonathan Harbourne | Jonathan Harbourne, about £12 a year | [add a GoDaddy delegate] |

| Usage counts | PostHog (EU) | Jonathan Harbourne | Free tier | [add a second member] |
| Feedback board | Nearmark website (Supabase project rzfrn…) | Jonathan Harbourne | Free tier | [add a second member] |

## If the site goes offline

Anyone can deploy their own copy from the repository with `npx vercel --prod`, or serve the page from any static host. Only the lookup needs a serverless function. Without it, services can still be entered by hand.

## Stores nothing

No database, no user accounts, no logs of which domains were looked up. There is nothing to hand over and nothing to leak.
