# Spare Key

*Working name.* A small tool for anyone who builds or looks after websites for other people: charities, clubs, friends, small businesses.

You add a client's domains. Spare Key looks up public records to find where their website, email and domain settings live and when the domain renews. You fill in whose name each account is in, who pays, and whether anyone else can get in. It then shows what would break if you were unavailable, and writes a Word handover document for the client to keep.

## Principles

- **The map, not the keys.** It never asks for passwords. It records *where* they are kept.
- **Nothing stored on a server.** The only thing sent anywhere is a domain name, to a lookup function that checks public DNS, registration (RDAP) and certificate records and keeps nothing. The inventory lives in the browser while you work, and in a JSON file you save.
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
| Lookup function (Vercel) | `api/lookup.js`, with provider recognition in `api/_lib/infer.js` |

The lookup function uses Cloudflare's public DNS-over-HTTPS resolver, rdap.org for registration data, and a direct TLS connection for the certificate. It recognises common registrars, DNS hosts, website hosts, email providers and sending services, and says "Unrecognised" rather than guessing.

## Run it

There is no build step.

```
npm test                 # unit tests (Node 20+)
npx vercel               # preview deployment
npx vercel --prod        # production
```

Locally, any static server works for the page. The lookup needs the Vercel function, so use `npx vercel dev` to try lookups on your own machine.

## Before going public

- Change `FEEDBACK_URL` and `SOURCE_URL` at the top of `app.js` once the GitHub repository exists.
- Choose the final name and domain.
- Consider a rate limit on `/api/lookup` (Vercel Firewall rules work without code).

## Licence

MIT. See [LICENSE](LICENSE).
