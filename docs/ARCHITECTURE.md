# Architecture

Spare Key is a static website. There is no server-side code, no database and no build step for the site itself. Every page is plain HTML, CSS and JavaScript modules, served by Vercel.

```
Browser ──► sparekey.dev (static files on Vercel)
   │
   ├─► cloudflare-dns.com        DNS records (DNS over HTTPS)
   ├─► data.iana.org             which registry runs each domain ending
   ├─► the registry (RDAP)       registrar, registration and renewal dates
   └─► api.certspotter.com       certificates, from Certificate Transparency logs
```

The browser only sends a domain name, and only to those services. The Content-Security-Policy in `vercel.json` lists them in `connect-src`, and the browser refuses everything else.

## Files

| Path | What it is |
|---|---|
| `index.html`, `app.js` | Cover page and the six-step tool |
| `ask.html` + `lib/ask.js` | Owner request page |
| `guide.html` + `lib/guide.js` | Guide |
| `domain-policy.html` + `lib/policy-check.js` | Domain name policy and old-address checker |
| `check.html`, `privacy.html`, `terms.html`, `feedback.html` | Content pages |
| `lib/model.js` | Inventory model, defaults and validation |
| `lib/lookup.js` | Lookups in the browser; `RDAP_HOSTS`; `LOOKUP_SERVICES` |
| `lib/infer.js` | Recognises providers from DNS and registry data |
| `lib/risks.js` | Risk rules and grouping |
| `lib/progress.js` | Step completion for the progress rail |
| `lib/docgen.js` | Builds the Word continuity plan in the browser |
| `lib/policy.js` | Domain policy questions, clauses and reporting routes (one source) |
| `lib/request.js` | Owner requests: encode and decode the link fragment, write the emails |
| `lib/site.js`, `lib/analytics.js`, `lib/version.js` | Shared: theme switch, footer, cookieless analytics, version |
| `vendor/docx.iife.js` | The docx library, vendored so no CDN is needed |
| `fonts/` | Geist and Geist Mono (SIL Open Font License) |
| `templates/` | Downloadable Word and Excel templates |
| `.well-known/security.txt` | Security contact |

## Generated files

`node scripts/pages.mjs` writes:

- every content page, from `scripts/pages.mjs`, `scripts/check-page.mjs` and `scripts/policy-page.mjs`
- the shared header and footer into `index.html`
- the CSP in `vercel.json`, from `RDAP_HOSTS`
- `.well-known/security.txt`

A test fails if any of these are out of date. `npm run templates` rebuilds the three templates.

## Design decisions

| Decision | Why |
|---|---|
| No server | Nothing can be stored or leaked, and the privacy promise can be checked in a browser |
| Lookups in the browser, limited by CSP | Makes "nothing leaves except domain names" enforceable, not just promised |
| Certificates from CT logs, not by connecting to the site | Connecting would need a server or an open CSP. The trade-off: a wrong certificate being served can't be detected |
| Owner requests in the URL fragment | Browsers never send the fragment to a server, so the request is never logged |
| Word output, generated in the browser | The client keeps a document that works without Spare Key |
| JSON inventory with a published format | Anyone can read or rebuild it without this site |
| Vendored docx and self-hosted fonts | No third-party CDN, and a strict CSP |
| No inline scripts or styles | Required by the CSP. CSS custom properties are set through the CSSOM |
| Registries allowlisted (`RDAP_HOSTS`) | Keeps the CSP specific. A domain whose registry isn't listed still works, without its renewal date |
