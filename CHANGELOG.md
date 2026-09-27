# Changelog

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
