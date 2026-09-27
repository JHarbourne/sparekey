# Releasing

## Versions

Semantic versioning. The version is in `package.json` and `lib/version.js` (a test checks they match) and shows in the footer. Record every release in `CHANGELOG.md`.

## Steps

1. Make the change. If you edited `scripts/pages.mjs`, `scripts/*-page.mjs` or `RDAP_HOSTS`, run `node scripts/pages.mjs`. If you edited templates or `lib/policy.js`, run `npm run templates`.
2. `npm test`, and the browser tests if you can.
3. Bump the version in `package.json` and `lib/version.js`, and add a `CHANGELOG.md` entry.
4. Commit and `git push`.
5. GitHub Actions runs the unit tests, then the browser and accessibility tests, then deploys to production. A pull request gets a preview deployment instead.
6. Check the live site (see `TESTING.md`, manual checks).

To run the workflow by hand: the repository's **Actions** tab, **CI**, **Run workflow**. To deploy by hand from a Mac: `npx vercel --prod` in the project folder.

## Secrets (GitHub, Settings, Secrets and variables, Actions)

| Secret | Where it comes from |
|---|---|
| `VERCEL_ORG_ID` | `orgId` in `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | `projectId` in `.vercel/project.json` |
| `VERCEL_TOKEN` | vercel.com, Account Settings, Tokens. Scoped to the team, one-year expiry |

Set them with `gh secret set NAME`, one at a time, pasting only into Terminal.

**The token expires after a year.** When deploys start failing with an authentication error, create a new token and run `gh secret set VERCEL_TOKEN`. Put the expiry date in a calendar.

## Rolling back

In Vercel, open the project's **Deployments**, choose the last good one and **Promote to Production**. Then revert the commit on GitHub so the next push doesn't redeploy the problem.
