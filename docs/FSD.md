# Spare Key – Functional Specification

| | |
|---|---|
| Product | Spare Key (sparekey.dev) |
| Version described | 0.5.0 |
| Owner | Jonathan Harbourne, hello@jharbourne.com |
| Status | Live, open source (MIT) |
| Last updated | 27 September 2026 |

## 1. Purpose

Small organisations (charities, clubs, small businesses, individuals) often have one person who built and runs their website. The domain, hosting and email are frequently in that person's accounts and paid on their card. If that person can't work for a long time, the organisation may lose its website, its email and eventually its domain name.

Spare Key helps that person, or the organisation itself, write a **website continuity plan**. The plan records what the website and email depend on, whose name each account is in, who pays for each one and what to do in an emergency. It also finds the single points of failure. It never asks for passwords, and nothing typed into it is sent to a Spare Key server.

## 2. Users

| Persona | Need | Entry point |
|---|---|---|
| **Builder**: a freelance or volunteer web person looking after one or more sites | Write a continuity plan for each client quickly, and look professional doing it | Cover page, "I build websites" |
| **Owner**: the person or organisation that owns the website | Ask their web person for a plan, and have it sent to the right person | "I own a website" (/ask) |
| **Recipient**: an IT or security lead, trustee or successor | Understand the setup and act on it | The Word plan, or the inventory file opened in Spare Key |
| **Policy maker**: a trustee, clerk or IT lead | Adopt a domain name policy and check old addresses | /domain-policy |

## 3. Principles (constraints on every feature)

1. **No passwords.** The tool asks where passwords are kept, never for the passwords themselves.
2. **Nothing sent to us.** There is no Spare Key server. Lookups run in the browser. Only a domain name is sent, and only to public lookup services. A Content-Security-Policy enforces this.
3. **No cookies, no tracking.** Analytics are optional, cookieless and send only named counts, never domains or typed text.
4. **Plain English.** Everything the owner or recipient reads avoids jargon, or explains it.
5. **Accessible.** WCAG 2.2 AA, tested automatically with axe in CI.
6. **Not a single point of failure itself.** The plan is a Word document the client keeps. The inventory is a documented JSON format. The code is open source.

## 4. Pages

| Page | Path | Purpose |
|---|---|---|
| Cover | `/` | What it does, two calls to action by persona, how it works, what it flags, principles |
| The tool | `/#start` | Six steps (section 5) |
| For website owners | `/ask` | Owner request form (section 6) |
| Guide | `/guide` | Six-step timeline, risk explanations, jargon buster, templates |
| Questions and answers | `/faq` | Filterable FAQs |
| Domain name policy | `/domain-policy` | Old-address checker, questions, policy to copy, how to report misuse (section 8) |
| Check it yourself | `/check` | What is sent where, and how to verify it (section 9) |
| Privacy, Terms, Feedback | `/privacy`, `/terms`, `/feedback` | Legal pages, and feedback to the Nearmark board or GitHub |
| security.txt | `/.well-known/security.txt` | How to report security problems |

## 5. The tool

### 5.1 Step 01 – People
Fields: client name, organisation, contact; builder name, contact; emergency contact name, relationship, contact; technical helper name, contact.

### 5.2 Step 02 – Domains
- **Look up** a domain. The browser queries public DNS, the registry (RDAP) and Certificate Transparency logs. Results: registrar, renewal date, DNS host, website host, email host, sending services, SPF, DMARC, certificate issuer and expiry.
- Each lookup creates draft **services** (registration, DNS, website, email, sending) for the builder to complete.
- **The plan for each address**: In use / Points to our current website / Retired, and we keep renewing it / We plan to let it go.
- **Old addresses**: the user adds addresses used before a rename, merger or old project. Spare Key reads the registration record (registrar, registration date, renewal date) and where the address points now. The user records "Is it still yours?" and "Stopped using it in (year)".

### 5.3 Step 03 – Services
Each service: name, type, provider, domain, purpose, whose name the account is in, second admin (yes/no/not sure), who pays, cost, renewal date, auto-renew, notes. A service is "complete" when owner, payer and second admin are recorded.

### 5.4 Step 04 – Access and backups
Where passwords are kept, where backups are kept, whether the public can create accounts on the website (none / approved / open / not recorded), and notes.

### 5.5 Step 05 – Risks
Recalculated on every change. Levels: **Serious**, **Fix soon**, **Check**. Repeated per-service risks are grouped into one line. When the last serious risk is cleared, the key in the logo turns and a toast says "Spare key cut. Nothing serious left."

### 5.6 Step 06 – Save and hand over
- **Download the plan** (Word). Gaps are highlighted in yellow.
- **Save the inventory** (JSON), and **open** a saved one.
- **Start again** (two-press confirm) clears the browser draft.
- If the work came from an owner's request, **Email the plan** opens a pre-written reply to the owner or their nominated recipient.

The draft is saved in the browser's local storage on every change, and flushed on page hide.

## 6. Owner request flow (/ask)

1. The owner enters their name, organisation, email, their web person's name and email, website addresses, an optional note, and **who should receive the finished plan**: themselves, or someone else (name, role, email).
2. Spare Key writes an email headed "Website continuity plan for …", worded as routine contingency planning. It tells the builder to check the link starts with the real address.
3. The request is encoded in the link's `#fragment`, which browsers never send to a server. The web person's email address is never put in the link.
4. A plain-English quick check of each address is shown to the owner.
5. When the builder opens the link, the request is read, removed from the address bar, and the tool is pre-filled and the domains looked up. If the builder already has a draft for another client, they are offered Start / Save my draft first / Keep my draft.

## 7. Risk rules

| Rule | Level |
|---|---|
| No emergency contact | Serious |
| Service in the builder's name with no second admin | Serious |
| Domain expired, or renews within 30 days | Serious |
| Email on a privately run server | Serious |
| Security certificate expired | Serious |
| A domain the organisation plans to let go | Serious |
| Old address registered again after the year the organisation stopped using it | Serious |
| Old address still held, lapsing within 60 days | Serious |
| Password or backup location not recorded | Fix soon |
| Only one person can manage a service | Fix soon |
| Service paid by the builder | Fix soon |
| Renewal date unknown; renews within 90 days; auto-renew not confirmed | Fix soon |
| No current certificate found in the public logs; certificate expires within 14 days | Fix soon |
| No SPF record | Fix soon |
| Old address not registered (anyone can buy it) | Fix soon |
| Old address registered again within the last three years (no year given) | Fix soon |
| Anyone can create an account on the website | Fix soon |
| Second admin not recorded; account holder not recorded | Check |
| No DMARC record | Check |
| Old address not yet looked up, or holder not recorded | Check |
| Whether the public can create accounts is not recorded | Check |

## 8. The continuity plan (Word)

Title: "[Organisation]: website continuity plan". Sections:

1. The short version (callout), then **In the first week**
2. What there is
3. Who pays, and what happens if the money stops
4. What a helper would need to do
5. Access, passwords and backups
6. Things to fix (grouped risks)
7. **Domain names**: each domain and its plan, old addresses and what was found, and the domain name policy to adopt
8. Contacts
9. Notes (if any)

Footer: "[Organisation]: continuity plan | Confidential | Made with Spare Key (sparekey.dev) | Page n".

## 9. Domain name policy (/domain-policy)

- **Check an old address now**: the same check as step 02, with a plain-English result (someone else probably holds it / free for anyone to register / still registered since…).
- **Nine questions to answer.**
- **A nine-clause policy to copy**, including the release clause: "No domain is released, allowed to lapse or transferred to anyone else until someone has checked what still links to it and recorded who decided that letting it go was safe."
- **Download as Word** (`templates/spare-key-domain-policy.docx`), with adoption fields, the questions and a domain register.
- **If an old address is being misused**: the registrar or host, the Gambling Commission, Report Fraud, Google, and everyone who links to it.

The questions, clauses and reporting routes live in `lib/policy.js` and feed the page, the generated plan and the Word download.

## 10. Templates

| File | Contents |
|---|---|
| `spare-key-continuity-plan-template.docx` | The plan with example text to replace |
| `spare-key-inventory-template.xlsx` | At a glance, Services (with drop-downs and a Risk column), Domains (days left), Contacts |
| `spare-key-domain-policy.docx` | The policy, adoption fields, questions and a domain register |

Built by `npm run templates`.

## 11. Data

The inventory format is documented in `FORMAT.md` (format `sparekey-inventory`, version 1). Fields added in 0.5.0 (`domains[].status`, `oldDomains`, `publicAccounts`) are optional. Older files open with defaults.

## 12. Non-functional requirements

| Area | Requirement |
|---|---|
| Privacy | No server-side processing of user data. CSP `connect-src` limited to the lookup services, the registries in `RDAP_HOSTS` and the PostHog EU host |
| Security | No inline scripts or styles (enforced by test). `frame-ancestors 'none'`, `form-action 'none'`, `referrer: no-referrer` |
| Accessibility | WCAG 2.2 AA. axe in CI on every page, in light and dark. Keyboard operable, visible focus, reduced motion respected |
| Performance | Static files only. Fonts self-hosted |
| Browsers | Current Chrome, Edge, Firefox and Safari |
| Availability | Hosted on Vercel. If the site disappears, plans and inventory files still work, and the code can be run locally |

## 13. Out of scope

- Storing anything on a server, or user accounts
- Storing passwords, even encrypted
- Checking the certificate a website actually serves (Spare Key never connects to the website itself)
- Monitoring or alerts over time

## 14. Open items

- The PostHog key is not set, so analytics are off.
- The investigation into lapsed British domains is not yet published. When it is, link it from /domain-policy.
- Consider buying lookalike domains (sparekey.app, spare-key.dev) and setting up certificate alerts for "sparekey".
