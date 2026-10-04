// "Passwords, sign-in codes and backups": what Spare Key recommends, and why.
export const passwordsPage = ['Passwords, sign-in codes and backups', 'What to do with the logins, two-step sign-in codes and backups for a website, so the owner can carry on without you.', `
<p class="eyebrow">passwords and backups</p>
<h1>Logins, sign-in codes and backups</h1>
<p class="lede">The usual advice is “don’t write passwords down”, which is right, and then nothing about what to do instead. Here is what we recommend, best first, so the people who own a website can still get in if you can’t.</p>

<h2>Logins</h2>
<ol class="ladder">
  <li class="good"><strong>A shared vault the client owns, with you as a member.</strong>
    <span>The client’s logins live in their own password manager, and you are invited in. If you are not there, nothing changes for them. 1Password and Bitwarden both have shared vaults for organisations. For a client who uses Apple devices, the Passwords app can share a group of logins with people you choose.</span></li>
  <li class="ok"><strong>Your password manager, with emergency access.</strong>
    <span>Some password managers let you name someone who can ask for access, which you can refuse within a waiting period. Bitwarden calls this Emergency Access.</span></li>
  <li class="ok"><strong>Your password manager, with its master password sealed with your executor.</strong>
    <span>Write down only the one master password and the recovery kit, seal them, and leave them with your executor or solicitor, with your will. 1Password’s Emergency Kit is made for this.</span></li>
  <li class="warn"><strong>Written down.</strong>
    <span>The National Cyber Security Centre’s concern is passwords written down “where they can be easily found”. Never on a note by the computer. If you must, sealed and kept with your executor.</span></li>
  <li class="bad"><strong>Only in your browser or Apple Keychain.</strong>
    <span>If you can’t be reached, no one can get them. Apple’s Legacy Contact gives family access to photos and files, but not to Keychain passwords.</span></li>
</ol>
<p><strong>A security key is not a password store.</strong> Keys such as YubiKey are a second way of proving it’s you. They hold no passwords, and if only you have one, they are another way to be locked out. Register a spare.</p>
<p><strong>To pass on a password once</strong>, use an encrypted link that expires, such as Bitwarden Send or a 1Password share link. Not email or a text message.</p>

<h2>Two-step sign-in codes</h2>
<p>This is the most common way people get locked out: they have the password, but the code goes to a phone they don’t have.</p>
<ul class="checklist">
  <li>Add the client’s phone, or a second security key, to the domain registrar, hosting and email accounts.</li>
  <li>Save each account’s recovery codes in the shared vault.</li>
  <li>Turn on two-step sign-in wherever it isn’t on yet, starting with the domain registrar.</li>
</ul>

<h2>Backups</h2>
<p>Keep three copies, on two different kinds of storage, with one away from the hosting company, and at least one in the client’s own account. Then, once a year, try restoring one. A backup no one has restored may not work.</p>
<table class="svc-table">
  <thead><tr><th scope="col">If the site is…</th><th scope="col">Back up</th><th scope="col">Where to</th></tr></thead>
  <tbody>
    <tr><td>Built from code (Astro, Vite, Next.js) and hosted on Vercel, Netlify or similar</td><td>The code. The repository is the backup.</td><td>A repository the client owns or can reach, such as a GitHub organisation, not only your own account</td></tr>
    <tr><td>Using a content editor or database (WordPress, Tina, Supabase, MediaWiki)</td><td>The content and the database, every night or week</td><td>The client’s own Google Drive, Dropbox or cloud storage, outside the hosting account</td></tr>
    <tr><td>Made with a site builder (Wix, Squarespace)</td><td>An export of pages, images and form entries, where the builder allows it</td><td>The client’s own storage</td></tr>
    <tr><td>Email</td><td>Usually nothing: the provider keeps it. Export a copy once a year if old mail matters</td><td>The client’s own storage</td></tr>
  </tbody>
</table>
<p>The host’s own backups are welcome but don’t count as the off-site copy: if the account is closed or unpaid, they go with it.</p>

<h2>Expiry dates</h2>
<p>Domain names, certificates, hosting plans, app store memberships and API keys all run out. In Spare Key, give each service its renewal or expiry date, then use <strong>Add the dates to a calendar</strong> in step 06. Every date goes into your calendar, with reminders 30 days and 7 days before.</p>

<h2>Sources</h2>
<ul class="sources">
  <li><a href="https://www.ncsc.gov.uk/collection/passwords/updating-your-approach">National Cyber Security Centre: password guidance</a></li>
  <li><a href="https://support.apple.com/guide/iphone/share-passwords-iphe6b2b7043/ios">Apple: share passwords with people you trust</a></li>
  <li><a href="https://bitwarden.com/help/emergency-access/">Bitwarden: Emergency Access</a></li>
</ul>
<p class="sub">Spare Key never asks for a password, and never stores one. <a href="check.html">Check it yourself</a>.</p>
`];
