# Spare Key

Live at https://sparekey.dev

A small tool for anyone who builds or looks after websites for other people: charities, clubs, friends, small businesses.

You add a client's domains. Spare Key looks up public records to find where their website, email and domain settings live and when the domain renews. You fill in whose name each account is in, who pays, and whether anyone else can get in. It then finds the single points of failure and writes a Word continuity plan (a handover document) for the client to keep.

## Principles

- **The map, not the keys.** It never asks for passwords. It records *where* they are kept.
- **No server at all.** Lookups run in the browser. The only thing sent anywhere is a domain name, straight to public lookup services (Cloudflare DNS, IANA, the domain's registry, Cert Spotter). The Content-Security-Policy in `vercel.json` blocks every other address, and a test keeps it in step with `lib/lookup.js`. The inventory lives in the browser while you work, and in a JSON file you save.
- **No accounts, cookies, analytics or tracking.** The draft is kept in the browser's local storage on your own device only, and "Start again" clears it.
- **It must not become the single point of failure it warns about.** The outputs (the Word document and the inventory file) belong to the client and work without this site. The file format is documented in [FORMAT.md](FORMAT.md) so anyone can read it. The code is MIT-licensed so anyone can run it.
- **Accessible.** Built to WCAG 2.2 AA: labelled controls, keyboard use, visible focus, status messages announced to screen readers, dark mode and reduced motion respected.
- **Feedback built in.** Every page links to the issue tracker.

## How it works

| Part | File |
| --- | --- |
| Page | `index.html`, `styles.css`, `app.js` |
| Inventory model and file format | `lib/model.js` |
| Risk checks | `lib/risks.js` |
| Word document | `lib/docgen.js` (uses the `docx` library, vendored as `vendor/docx.iife.js`) |
| Lookups (in the browser) | `lib/lookup.js`, with provider recognition in `lib/infer.js` |

Lookups use Cloudflare's public DNS-over-HTTPS resolver, each registry's RDAP service (found through IANA's list, limited to the registries in `RDAP_HOSTS`), and Cert Spotter's Certificate Transparency API for the certificate. Spare Key never connects to the website itself, so it cannot see a wrong certificate being served; it reports whether a current certificate exists. It recognises common registrars, DNS hosts, website hosts, email providers and sending services, and says "Unrecognised" rather than guessing.

## Run it

There is no build step.

```
npm test                         # unit tests (Node 20+), including colour contrast
node scripts/serve.mjs           # static server on http://localhost:4173
npx playwright test              # browser and axe accessibility tests
node scripts/pages.mjs           # after editing the shared header/footer or page text
npx vercel dev                   # try real lookups locally
```

## Pipeline (GitHub Actions)

`.github/workflows/ci.yml` runs on every push and pull request:

1. **Unit tests**: lookup parsing, risk checks, the Word document, version, generated pages, CSP safety, analytics settings and WCAG colour contrast for both themes.
2. **Browser and accessibility**: Playwright runs the main flows, then axe-core scans every page, in light and dark, against WCAG 2.0, 2.1 and 2.2 A and AA.
3. **Deploy**: only if both pass. Pushes to `main` go to production, and pull requests get a preview.

Vercel's own Git deployments are switched off in `vercel.json`, so nothing reaches production without passing the checks. Add three repository secrets: `VERCEL_TOKEN` (Vercel → Account settings → Tokens), `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` (both in `.vercel/project.json`).

## Analytics

PostHog, EU cloud, set up in `lib/analytics.js`. It does nothing until `POSTHOG_KEY` is set. It is cookieless, has no person profiles, autocapture or session recording, respects Do Not Track, and only sends a fixed list of named events with numbers. In the PostHog project settings, also turn on **Cookieless server hash mode** and **Discard client IP data**.

## Feedback

The feedback page links to the Nearmark feedback board, where ideas are tagged with the `sparekey` area (see `nearmark-website/supabase/add-sparekey-area.sql`). Bugs go to GitHub issues.

## Documentation

- [Functional specification](docs/FSD.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Security and privacy](docs/SECURITY-AND-PRIVACY.md)
- [Testing](docs/TESTING.md)
- [Releasing](docs/RELEASING.md)
- [Accessibility statement](docs/ACCESSIBILITY.md)
- [Inventory file format](FORMAT.md), [Changelog](CHANGELOG.md), [Spare Key's own continuity plan](CONTINUITY.md)

## Still to do

- Add the PostHog key in `lib/analytics.js` if you want usage counts.
- To support another registry, add its host to `RDAP_HOSTS` and run `node scripts/pages.mjs` (it regenerates the CSP).

## Licence

MIT. See [LICENSE](LICENSE).
