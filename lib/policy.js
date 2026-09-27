// The domain name policy: the questions to answer and a policy to copy.
// One source for the web page, the generated continuity plan and the Word download.

export const QUESTIONS = [
  ['Who owns our domains?', 'The registrant should be the organisation, not a person. Check the name on each registration.'],
  ['Who can log in to the registrar account?', 'At least two people, using their own logins.'],
  ['Where do renewal reminders go?', 'To a shared role address, such as it@ or admin@, not one person’s inbox.'],
  ['Does each domain renew automatically, and on whose card?', 'Auto-renew on, paid by the organisation, for more than one year at a time where you can.'],
  ['Which addresses have we used in the past?', 'Before a rename, a merger, a move to a shorter address, or for an old project or campaign.'],
  ['What does each old address do now?', 'Type it into a browser. It should point at your current website, or say plainly that it has moved.'],
  ['Who decides to let a domain go, and what do they check first?', 'Most policies say nothing about this. It is where the risk is.'],
  ['Can the public create accounts on our website?', 'If so, new accounts should be approved by a person before they can publish anything.'],
  ['Who checks all of this, and how often?', 'Once a year is enough, and whenever the organisation changes its name, merges or closes.'],
];

// [heading, text]
export const POLICY = [
  ['Ownership', 'Every domain name we use, or have used, is registered in the organisation’s name, never in the name of an employee, volunteer or supplier.'],
  ['Access', 'At least two named people can log in to each registrar account, each with their own login. Renewal reminders go to a shared role address.'],
  ['Renewal', 'Every domain is set to renew automatically, paid by the organisation. Where possible we renew for more than one year at a time.'],
  ['Record', 'We keep a list of every domain: what it is for, where it is registered, when it renews and who is responsible for it. The list includes addresses we no longer use.'],
  ['Old addresses', 'When we stop using an address, because of a rename, a merger, a new website or the end of a project, we keep renewing it and point it at our current website. Keeping a domain costs far less than losing one.'],
  ['Releasing a domain', 'No domain is released, allowed to lapse or transferred to anyone else until someone has checked what still links to it and recorded who decided that letting it go was safe. If in doubt, we keep it.'],
  ['Closing down', 'If the organisation closes or merges, the trustees or directors decide who will keep renewing its domains, in the same way they decide what happens to the bank account.'],
  ['Public accounts', 'If our website lets members of the public create accounts, each new account is approved by a person before it can publish anything.'],
  ['Review', 'We review this list once a year, and whenever the organisation changes its name, merges or closes. We type each old address into a browser to see what it shows.'],
];

// Where to report an old address that is being misused: [who, what, url?, 'uk'?].
// Entries marked 'uk' only apply to .uk addresses and are shown only after one is checked.
export const REPORTING = [
  ['The website’s current registrar or host', 'Their abuse contact is usually listed in the public registration record or on their website.'],
  ['The Gambling Commission', 'If it advertises gambling without a UK licence.', 'https://www.gamblingcommission.gov.uk/contact-us/page/report-something-in-confidence', 'uk'],
  ['Report Fraud', 'If a website you still run has been broken into or had content added.', 'https://www.reportfraud.police.uk', 'uk'],
  ['The regulator or police in the address’s country', 'If it advertises illegal gambling, or a website you still run has been broken into. Check an address above and, for a .uk address, we’ll show you exactly where to go.', null, 'other'],
  ['Google', 'To report search spam that uses your old name.', 'https://developers.google.com/search/help/report-quality-issues'],
  ['Everyone who links to it', 'Ask them to update the link: funders, partners, universities and Wikipedia.'],
];
