# Security and privacy

## What Spare Key holds

Nothing, on any server. Everything a user types stays in their browser (local storage, for the draft) until they download it. The only data that leaves the browser is a domain name, sent to public lookup services to read public records.

## What leaves the browser

| Data | To | Why |
|---|---|---|
| Domain name | cloudflare-dns.com | DNS records |
| Nothing (a fixed file) | data.iana.org | The list of registries |
| Domain name | The registry for its ending (listed in `RDAP_HOSTS`) | Registration record |
| Domain name | api.certspotter.com | Certificates from public logs |
| Named counts only, if a key is set | eu.i.posthog.com | Anonymous usage counts |

Analytics are cookieless (`cookieless_mode: 'always'`), with no person profiles, no autocapture and no session recording. URLs are stripped of query strings and fragments before sending, and event properties must be numbers or booleans. Do Not Track is respected. The key is currently empty, so nothing is sent.

## Enforcement

- **Content-Security-Policy** (`vercel.json`, generated): `connect-src` lists only the services above. `default-src 'self'`, `form-action 'none'`, `frame-ancestors 'none'`, `base-uri 'none'`, `object-src 'none'`.
- **Tests**: `test/lookup.test.js` checks the CSP matches the code and has no wildcards. `e2e/privacy.spec.js` records every request a real lookup makes and fails on any other host, or on a connection to the website itself. The local server sends the same headers, so browser tests run under the real CSP.
- **No inline code**: a test fails if any page has an inline script or style attribute.
- `Referrer-Policy: no-referrer`, and a restrictive `Permissions-Policy`.

## Threats considered

| Threat | Mitigation |
|---|---|
| The site collects data it shouldn't | No server. CSP, tested, and verifiable by anyone (/check) |
| Someone copies the open-source site to harvest details | Spare Key never asks for passwords, and says so on every page. A copy that does is visibly not us. /check explains how to recognise the real site. Anything a copy could collect is mostly public record |
| A fake "request" email sent to builders | The request email tells the builder to check the link starts with https://sparekey.dev |
| An owner request exposes the builder's email | The builder's email is never put in the link |
| An owner request is logged by a server | It is carried in the URL fragment, which browsers never send |
| A malicious inventory file | Validated on open; all rendering escapes text; no HTML from files is trusted |
| Supply chain | No runtime npm dependencies. docx is vendored. CI installs Playwright and axe for tests only |
| Lookalike domains | Open item: buy sparekey.app and spare-key.dev, and watch Certificate Transparency for "sparekey" |

## Reporting a problem

Email hello@jharbourne.com, or report privately through GitHub (Security, then Report a vulnerability). See `/.well-known/security.txt`.

## Legal basis

See the privacy notice at /privacy. The data controller for the limited processing described there is Jonathan Harbourne.
