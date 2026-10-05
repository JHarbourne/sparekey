# Changelog

## 0.8.7 – 2026-10-05

- **Before you start.** Step 01 opens with a short list of what to have to hand: the web addresses, access to the domain, hosting and email accounts, the project file or WordPress dashboard, contact details, and how logins and backups are kept. It says none are required and that work is saved in the browser. “Got it, hide this” closes it for good on that browser. The same list is in the guide, under “What you’ll need”, which prints cleanly.

## 0.8.6 – 2026-10-04

- **Who registered the domain?** Each domain in step 02 now asks whether the client registered it, you registered it in their name, you registered it in your own name or account, or a previous developer did. If it’s in yours, Spare Key flags it as serious and explains how to move it to the client’s own account with the client named as the legal owner. A previous developer’s registration is flagged to check. The answer fills in whose name the registration service is in, and the continuity plan’s domain table shows who registered each one.
- Headings balance across their lines, so a single word isn’t left on its own, and arrows on links stay on the same line as their words.

## 0.8.5 – 2026-10-04

- The template download icons are square tiles, like app icons, with a plain document or spreadsheet symbol instead of a W or X, so they don’t imitate Microsoft’s own icons.

## 0.8.4 – 2026-10-04

- **Email and phone, not “Contact”.** Each person in step 01 now has an Email box and an optional Phone box, so it’s clear what to put where. Phones get the number keypad and emails the email keyboard on a phone, and your own details can fill in from the browser.
- Both are checked when you leave the box: an email needs an @ and a full domain, and a phone number needs 7 to 15 digits. It’s a warning in red under the box, never a block, so a half-finished plan still saves.
- Plans and files from earlier versions keep their details: anything with an @ moves to Email, anything else to Phone.

## 0.8.3 – 2026-10-04

- The small headings inside each step, such as Client, You, the builder, Emergency contact, Old addresses and How the website is built, are green, so the page is easier to find your way around. The green passes the contrast checks in both themes.

## 0.8.2 – 2026-10-04

- **Usage counts are switched on**, with PostHog’s EU cloud, set up as the privacy notice describes: no cookies, no profiles, no recordings, named events with numbers only. Moving between steps, the survey and reading WordPress are now counted too. Automated browsers, including our own tests, are never counted.
- The accessibility test checks every step of the tool, and the CI no longer fails when Microsoft’s package server is unavailable.

## 0.8.1 – 2026-10-04

- **One step at a time.** The tool was about seven screens long. Now it shows one of its six steps at a time, with Back and Next at the bottom of each. The list of steps down the left is how you move around, with the current step marked; on a phone it becomes a bar across the top. Spare Key remembers which step you were on, and “Go to service” on a risk takes you to the right step. Printed, every step shows.
- **The survey is switched on**, with the Google Form’s link. It appears after the first plan and as a third option on the feedback page.
- The form script (docs/survey/create-form.gs) is fixed, and has showLinks to print the links again without making a second form.

## 0.8.0 – 2026-10-04

- **How is the website made?** Step 03 now starts with this question, and asks only what fits. A site builder (Wix, Squarespace, Shopify) gets no code questions. WordPress gets its own route. A site built from code gets the project files and the repository questions, as before. Spare Key fills in the answer from the lookup when the host makes it obvious, such as Wix or WP Engine, and says so.
- **WordPress, read automatically.** Paste WordPress’s own site information (Tools, Site Health, Info, Copy site info) and Spare Key reads the WordPress and PHP versions, the theme and every plugin, in the browser. Paid plugins and themes, such as Elementor Pro or Gravity Forms, become licences to record, and plugins linked to accounts, such as Akismet, Jetpack or WP Mail SMTP, become services. The pasted text is cleared, and paths and server details are never kept.
- New WordPress risks: PHP that no longer gets security fixes, plugins with updates waiting, plugins that only update by hand, and switched-off plugins left installed.
- The continuity plan says how the site is made and, for WordPress, lists the theme and plugins with their versions and how they update.

## 0.7.9 – 2026-10-04

- **An optional survey after the first plan.** Once someone downloads their first continuity plan, Spare Key offers a two-minute survey, once: how likely they are to recommend it (Net Promoter Score) and the ten System Usability Scale statements. It also appears on the feedback page. It stays switched off until the form’s link is added in lib/site.js.
- docs/survey/create-form.gs builds the Google Form, its answers spreadsheet and a Scores sheet that works out NPS and SUS automatically.
- The privacy notice explains the survey.

## 0.7.8 – 2026-10-04

- **Where the code lives**, a new section of the guide written for people who build websites on their own and may never have used GitHub: what to do for site builders, WordPress and coded sites; what GitHub and an organisation are; how to give each client their own organisation, move the code into it and keep the site publishing; what to do if the files are only on your computer; and your own sites. Linked from step 03 and from the advice under “Who can reach the code?”.
- “Repository” and “GitHub” are in the jargon buster.

## 0.7.7 – 2026-10-04

- The domain policy page was over three screens long on a laptop and five on a phone. It is now in three tabs: check an address (with what to do if one is misused), the questions to answer, and the policy to copy. Each tab has its own address, works with the arrow keys, and ends with a link to the next. Printed, or without JavaScript, the whole page shows as before.

## 0.7.6 – 2026-10-04

- The domain policy page points organisations that already have a policy to the Domain Release Clause on jharbourne.com, to add to it rather than replace it.

## 0.7.5 – 2026-10-04

- **What to do next:** a risky answer in steps 03 and 04 now shows what to do about it, straight away, under the question. For example, choosing “Only in my own account” for the code explains how to move it into an organisation the client owns, and “Written down” for the logins warns where not to keep them and what is better.
- **Backups in more detail:** where the copies are (online, on a drive, or both), how often they are made, and how far back they go, each scored as a risk. The passwords page explains how often and how far back is enough.
- The continuity plan includes the new backup answers.

## 0.7.4 – 2026-10-04

- Links that leave Spare Key, such as the feedback board, GitHub and the services on the passwords page, open in a new tab, so the tool and anything typed into it stay put. They show a small arrow, and screen readers hear “opens in a new tab”. Email links are unchanged.

## 0.7.3 – 2026-10-04

- Fields and drop-downs are all the same height, and fields in a row line up along the bottom however long their labels are. A test checks every row.
- In the code address, press → to start with https://github.com/ rather than typing it.

## 0.7.2 – 2026-10-04

- **Set up your own vault:** the passwords page has a section for website owners on setting up a password vault in their own name and inviting their builder, with which one to choose (Apple Passwords shared group, a free Bitwarden organisation, or 1Password or Bitwarden Teams).
- The handover document gives the client those steps whenever the logins aren’t yet in a vault they own.
- The login risks now say to ask the client to set up the vault, rather than the builder creating one.

## 0.7.1 – 2026-10-04

- Drop-downs draw their own chevron, 14px in from the right edge, in every browser and both themes. A test now checks every drop-down, so it can’t slip again.
- Step 03 says that an environment file is optional, and how to show hidden files on a Mac.
- The passwords page links to each service it mentions: 1Password, Bitwarden, Apple Passwords and Legacy Contact, YubiKey, 2FA Directory, GitHub organisations, Google Drive, Dropbox and Backblaze B2.

## 0.7.0 – 2026-10-04

- **Found automatically:** other sites on a domain (subdomains named in the public certificate logs, with where each is hosted), and accounts linked to it (Google Search Console, Microsoft 365, Brevo, Apple iCloud+, Stripe and others from verification records; Mailchimp, SendGrid, Klaviyo, Resend and others from email-signing records). Each becomes a service to complete.
- **How the website is built:** drop `package.json` and `.env.example` in step 03. Spare Key recognises the framework and tools (Astro, Vite, Next.js, Leaflet…), the host, and services with accounts (Tina, PostHog, Supabase, Stripe, Mapbox, Google Maps…), plus any API keys by name. Read in the browser, never sent. From a real `.env` only the names are kept.
- **Where the code is, and who can reach it**, with a serious risk when only the builder can.
- **Logins, two-step sign-in and backups** are now clear choices that score as risks, instead of open boxes, with a new page of recommendations (/passwords).
- **API keys and tokens** are a kind of service with an expiry date, flagged 60 and 30 days before.
- **Add the dates to a calendar:** every renewal and expiry in the plan as an .ics file, with reminders 30 and 7 days before.
- The continuity plan includes how the site is built and the new access answers.

## 0.6.1 – 2026-10-04

- The version shows discreetly in the tool, under the progress meter, with a link to give feedback.
- Feedback goes to the shared feedback board as **product: Spare Key**, with the version you're using attached to each idea (`/feedback?product=sparekey&v=…`). The board now handles several products (Nearmark, Spare Key, Burgee Crew, Burgee Club).
- "Report a problem on GitHub" pre-fills the version in the issue.

## 0.6.0 – 2026-10-03

- **Plans in this browser.** Keep several plans at once and switch between them. A list at the top of the tool shows each plan with its domains and when it last changed, with Open, Remove, New plan and Clear everything. Plans stay in this browser on this device only, and the list says so.
- **New plan** on the cover and **Start a new plan** in the tool now start an empty plan and keep the others. Step 06's **Start again** is now **Delete this plan**.
- An owner's request always opens as its own plan, so it can't replace another client's work. The "Keep my draft" choice is no longer needed.
- Opening an inventory file adds it as a plan.
- A draft from an earlier version becomes the first plan.
- A misspelt or unregistered domain is reported ("nothing was found… check the spelling") instead of being added as an empty record. An existing empty record now says so.

## 0.5.7 – 2026-10-03

- **Start fresh.** When there is a half-finished draft in the browser, the cover shows a **Start fresh** button next to "Continue your draft", and the top of the tool offers "Clear it and start fresh". Both ask you to press twice, then clear everything in the browser (including lookups, old addresses and messages) and open a new, empty plan.
- The cover now counts any typed detail, not just a client name or domain, as a draft.

## 0.5.6 – 2026-09-29

- The light/dark switch now lives in its own small script that loads first. It keeps working even if the rest of the site's JavaScript is blocked or fails to load, and in older browsers (including Safari 13). Reported as stuck in light mode for one viewer and dark mode for another. A new test blocks every other script and checks the switch still works.

## 0.5.5 – 2026-09-27

- A **beta** flag next to the wordmark and beside the version in the footer. Both link to the feedback page, which now says Spare Key is in beta. The header flag is hidden on the smallest phones.

## 0.5.4 – 2026-09-27

- The menu fits at every width from 320px to wide desktop, tested every 10px. Full labels above 880px; "Builders" and "Owners" below that; Feedback and Source move to the footer below 760px, FAQs below 560px and the Guide below 370px.
- The tool, cover and downloads say "continuity plan" throughout: "New continuity plan", "Download the plan", "Email the plan to the owner". The downloaded file is now named …-continuity-plan.docx and the inventory …-inventory.json.

## 0.5.3 – 2026-09-27

- The FAQs have their own page, /faq, with the filter, linked from the menu, the footer and the guide. The guide keeps the six steps, the risks, the jargon buster and the templates.
- Three new questions: old addresses, sending the plan to an IT or security lead, and addresses outside the UK.
- The guide now talks about continuity plans rather than handovers.

## 0.5.2 – 2026-09-27

- The menu has **For website builders** alongside **For website owners** ("Builders" and "Owners" on phones). It opens the tool.
- The header fits the smallest phones (320px) without sideways scrolling. On those, the Guide link is in the footer only.
- The key in the logo stands on its own, without the box around it. The favicon is now black with the green key.
- The footer fits on two lines on desktop.

## 0.5.1 – 2026-09-27

- The domain policy page no longer assumes a UK address. The Gambling Commission and Report Fraud only appear after a .uk address is checked. Otherwise it points to the regulator or police in the address's country.
- Removed other UK-only wording (costs in pounds, NHS) from the policy, the risk text and the Word policy.

## 0.5.0 – 2026-09-27

- **Old addresses.** Step 02 asks for addresses the organisation used before a rename, merger or old project, and checks the public registration record for each. An old address registered again after the organisation stopped using it is flagged as serious. One that is free for anyone to register is flagged to fix soon.
- **The plan for each address**: in use, points to our current website, retired and still renewed, or planned to be let go. Letting one go is flagged as serious until someone has checked what still links to it.
- **Open sign-up forms.** Step 04 asks whether the public can create accounts on the website, and flags it if they can post without approval.
- **Domain name policy page** (/domain-policy): check an old address in the browser, nine questions to answer, a nine-clause policy to copy (including what to check before releasing a domain), and who to tell if an old address is being misused. Also as a Word download.
- The continuity plan has a new section 7, **Domain names**, with each domain's plan, old addresses and the policy. Contacts moves to section 8.
- The cover's list of what Spare Key flags now includes old addresses and open sign-up forms, and says "expired certificates" rather than "the wrong certificate", which it can no longer see.
- The reply email to an owner no longer repeats itself.
- Contact address hello@jharbourne.com on the privacy page, the check page and security.txt. The footer wordmark has the key.
- CI: the Word test uses the vendored library, actions updated to Node 24, and a **Run workflow** button.
- Documentation in docs/: functional specification, architecture, security and privacy, testing, releasing and an accessibility statement.

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
