# Testing

## Run everything

```
npm test                    # unit tests (Node's built-in runner, no install)
npx playwright test         # browser tests; install @playwright/test first
```

GitHub Actions runs both on every push and pull request, then deploys. See `.github/workflows/ci.yml`.

## Unit tests (`test/`)

| File | Covers |
|---|---|
| `infer.test.js` | Recognising registrars, DNS, website and email providers |
| `model.test.js` | Inventory model, services from a lookup, merging, validation |
| `lookup.test.js` | Browser lookups with a mocked `fetch`; never contacting the website; registries not on the list skipped; certificate choice; **the CSP matches the code** |
| `old-addresses.test.js` | Old-address, planned-release and public sign-up risk rules; older files opening |
| `request.test.js` | Owner requests: encoding, cleaning, emails, sending the plan to someone else |
| `docgen.test.js` | Builds a Word plan with the vendored docx and checks it |
| `site.test.js` | Version matches, generated pages up to date, no inline scripts or styles, analytics settings |
| `contrast.test.js` | WCAG contrast for every colour token, light and dark |

## Browser tests (`e2e/`)

| File | Covers |
|---|---|
| `flow.spec.js` | Cover to tool, lookup to download, draft survives reload, theme switch, footer, the key turning, old addresses |
| `owner.spec.js` | Owner request, builder opens it pre-filled, draft protection, sending to an IT lead, guide FAQ filter |
| `privacy.spec.js` | A real lookup only contacts allowed hosts; /check; templates download; /domain-policy checker |
| `a11y.spec.js` | axe (WCAG 2.2 AA) on every page and the tool, light and dark. **Runs in CI only** |

Most browser tests replace `lib/lookup.js` with a stub (`e2e/fixtures.js`), so they don't depend on live services. `privacy.spec.js` uses the real module with the services answered locally. The local server (`scripts/serve.mjs`) sends the production security headers.

## Manual checks before a release

- Look at the cover, tool, guide and /domain-policy in light and dark, at desktop and phone widths.
- Look up a real domain and download the plan. Open it in Word.
- Check an old address on /domain-policy.
- After deploying, open https://sparekey.dev/.well-known/security.txt.
