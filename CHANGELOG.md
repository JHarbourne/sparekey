# Changelog

## 0.4.0 – 2026-09-27

- No server at all. Lookups now run in the browser and send only the domain name, straight to public services (Cloudflare DNS, IANA, the registry, Cert Spotter). The Content-Security-Policy blocks every other address, and a test keeps it in step with the code. The Vercel function has gone.
- Certificates come from public Certificate Transparency logs. Spare Key never connects to the website itself.
- New “Check it yourself” page: exactly what is sent where, four ways to verify it, how to recognise the real site and how to report a fake.
- “Spare Key never asks for a password” on every page, and the request email tells the builder to check the link’s address.
- security.txt, pointing to GitHub’s private security reporting.
- The owner’s request is now for a website continuity plan, worded as routine contingency planning. The generated document is titled “website continuity plan”.
- The owner can have the plan sent to someone else, such as their IT or security lead.
- Emails start “Dear”.
- Matrix green replaces brass as the accent. The wordmark is 20% larger and reads “sparekey”.
- Blank Word and Excel templates to download from the guide.
- The local server sends the same security headers as Vercel, so the browser tests run under the real CSP.

## 0.3.2 – 2026-09-27

- A touch of brass, the colour of a real key: main buttons, the logo, “key” in the name at the top and in the footer, and the step numbers in the guide.
- Hover the logo and the key turns in the lock.
- The two main buttons now say who they are for: “I build websites” and “I own a website”, with a line explaining each.
- More space above the button at the end of a form.

## 0.3.1 – 2026-09-27

- Guide redesigned: six-step timeline with previews, risk cards with fixes, a jargon buster, a filter for the questions and an "On this page" menu that follows you.

## 0.3.0 (27 September 2026)
- For website owners: a plain-English page where an owner fills in a few details and gets an email to send their web person, with a link that opens Spare Key already filled in.
- Owners see a plain-English check of what is publicly visible about their website.
- The request travels only in the link's #fragment, is removed from the address bar on arrival, and analytics strips all fragments and query strings.
- Builders see who asked, and get a ready-made reply email; a request never silently replaces another client's draft.

## 0.2.0 (27 September 2026)
- Cover page explaining what Spare Key does, with Get started.
- New design: Geist and Geist Mono, a progress rail and a risk meter.
- Light and dark switch, remembered per device.
- Guide and FAQs, Privacy, Terms of use and Feedback pages; © JHarbourne.com 2026 in the footer with the version.
- Feedback goes to the shared Nearmark board (area: Spare Key).
- Privacy-first PostHog usage counts (off until a key is added).
- The key turns when the last serious risk is cleared.
- Registration data now comes straight from each registry.
- GitHub Actions pipeline: unit tests, Playwright, axe-core WCAG 2.2 AA in both themes, then deploy.
- Fixes: the tool no longer shows under the cover page; drafts are saved when the page closes.

## 0.1.0 (27 September 2026)
- First version: domain lookup, risk checks, Word handover document, inventory file.
