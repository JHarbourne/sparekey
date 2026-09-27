# Inventory file format (version 1)

A handover inventory is a UTF-8 JSON file. Anyone can read it with a text editor, and it is meant to outlive this tool.

```json
{
  "format": "sparekey-inventory",
  "version": 1,
  "updated": "2026-09-27T10:00:00.000Z",
  "client":    { "name": "", "organisation": "", "contact": "" },
  "builder":   { "name": "", "contact": "" },
  "emergency": { "name": "", "relationship": "", "contact": "" },
  "helper":    { "name": "", "contact": "" },
  "passwordsLocation": "Where the logins are kept. Never the passwords.",
  "backupsLocation": "",
  "notes": "",
  "domains": [
    { "name": "example.org", "lookup": { "...": "result of the last lookup, see below" } }
  ],
  "services": [
    {
      "id": "s1",
      "kind": "registration | dns | website | email | sending | database | other",
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
| `registration.registrar`, `registration.expires` | From RDAP |
| `dnsHost` | Who hosts the domain's DNS, from its nameservers |
| `webHost` | Who serves the website, from its address, CNAME or reverse DNS |
| `emailHost` | Who receives the domain's email, from its MX records |
| `senders` | Services allowed to send as the domain, from its SPF record |
| `spf`, `dmarc` | The raw SPF record and the DMARC policy |
| `certificate` | Issuer, expiry, and whether it matches the domain name |
| `checkedAt` | When the lookup ran |

Unknown fields are ignored when a file is opened, so later versions can add to the format without breaking older files.
