# Inventory file format (version 1)

A handover inventory is a UTF-8 JSON file. Anyone can read it with a text editor, and it is meant to outlive this tool.

```json
{
  "format": "sparekey-inventory",
  "version": 1,
  "updated": "2026-09-27T10:00:00.000Z",
  "client":    { "name": "", "organisation": "", "email": "", "phone": "" },
  "builder":   { "name": "", "email": "", "phone": "" },
  "emergency": { "name": "", "relationship": "", "email": "", "phone": "" },
  "helper":    { "name": "", "email": "", "phone": "" },
  "passwordsLocation": "Where the logins are kept. Never the passwords.",
  "backupsLocation": "",
  "notes": "",
  "domains": [
    {
      "name": "example.org",
      "status": "active | redirect | retired | release",
      "lookup": { "...": "result of the last lookup, see below" }
    }
  ],
  "oldDomains": [
    {
      "name": "old-name.org.uk",
      "stillOurs": "yes | no | unknown",
      "stoppedYear": "2021",
      "lookup": { "domain": "old-name.org.uk", "notRegistered": false, "registration": { "registrar": "", "created": "", "expires": "" }, "webHost": "", "checkedAt": "" }
    }
  ],
  "publicAccounts": "unknown | none | approved | open",
  "project": {
    "type": "unknown | builder | wordpress | code | other",
    "stack": ["Astro", "Vite"], "hosting": "Vercel", "repo": "https://github.com/…", "repoAccess": "unknown | client-owner | org | builder-only | none | na",
    "wordpress": { "version": "6.6.2", "php": "8.3.4", "multisite": false, "theme": { "name": "Astra", "version": "4.8.1", "parent": "optional" },
      "plugins": [{ "name": "Akismet", "version": "5.3.3", "autoUpdate": "on | off | unknown", "latest": "optional" }], "mustUse": ["…"], "inactive": 0 }
  },
  "passwordsMethod": "unknown | shared-client | emergency | sealed | paper | own-only | browser",
  "twoFactor": "unknown | shared | builder-phone | none",
  "backupMethod": "unknown | client-storage | git | host-only | builder-storage | none",
  "backupTested": "unknown | year | older | never",
  "backupWhere": "unknown | both | cloud | physical",
  "backupFrequency": "unknown | daily | weekly | monthly | manual",
  "backupKeep": "unknown | long | month | week | latest",
  "services": [
    {
      "id": "s1",
      "kind": "registration | dns | website | email | sending | database | code | cms | analytics | api | other",
      "name": "example.org registration",
      "provider": "GoDaddy.com, LLC",
      "purpose": "Plain-English description",
      "domain": "example.org",
      "accountOwner": "client | builder | other | (empty)",
      "paidBy": "client | builder | other | (empty)",
      "cost": "£20 a year",
      "renews": "2027-03-01",
      "autoRenew": "yes | no | unknown",
      "secondAdmin": "yes | no | unknown",
      "notes": "",
      "source": "lookup | manual"
    }
  ]
}
```

## Lookup result

| Field | Meaning |
| --- | --- |
| `registration.registrar`, `registration.expires`, `registration.created` | From the registry (RDAP) |
| `dnsHost` | Who hosts the domain's DNS, from its nameservers |
| `webHost` | Who serves the website, from its address, CNAME or reverse DNS |
| `emailHost` | Who receives the domain's email, from its MX records |
| `senders` | Services allowed to send as the domain, from its SPF record |
| `spf`, `dmarc` | The raw SPF record and the DMARC policy |
| `certificate` | Issuer and expiry of the newest current certificate in the public Certificate Transparency logs, or `{ "missing": true }` |
| `checkedAt` | When the lookup ran |

In 0.8.4 each person’s `contact` became `email` and `phone`; older files open with `contact` moved to whichever fits. `project.type` and `project.wordpress` were added in 0.8.0. `backupWhere`, `backupFrequency` and `backupKeep` were added in 0.7.5. `project`, `passwordsMethod`, `twoFactor`, `backupMethod`, `backupTested` and the kinds `code`, `cms`, `analytics` and `api` were added in 0.7.0, and lookups gained `subdomains` and `linked`. `status`, `oldDomains` and `publicAccounts` were added in Spare Key 0.5.0. They are optional, and older files open with `active`, `[]` and `unknown`.

Unknown fields are ignored when a file is opened, so later versions can add to the format without breaking older files.
