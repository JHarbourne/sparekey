// "Passwords, sign-in codes and backups": what Spare Key recommends, and why.
export const passwordsPage = ['Passwords, sign-in codes and backups', 'What to do with the logins, two-step sign-in codes and backups for a website, so the owner can carry on without you.', `
<p class="eyebrow">passwords and backups</p>
<h1>Logins, sign-in codes and backups</h1>
<p class="lede">The usual advice is “don’t write passwords down”, which is right, and then nothing about what to do instead. Here is what we recommend, best first, so the people who own a website can still get in if you can’t.</p>

<h2>Logins</h2>
<ol class="ladder">
  <li class="good"><strong>A shared vault the client owns, with you as a member.</strong>
    <span>The client’s logins live in their own password manager, and you are invited in. If you are not there, nothing changes for them. <a href="#own-vault">How a client sets one up</a>. <a href="https://1password.com/business">1Password</a> and <a href="https://bitwarden.com/products/business/">Bitwarden</a> both have shared vaults for organisations. For a client who uses Apple devices, the <a href="https://support.apple.com/guide/iphone/share-passwords-iphe6b2b7043/ios">Passwords app</a> can share a group of logins with people you choose.</span></li>
  <li class="ok"><strong>Your password manager, with emergency access.</strong>
    <span>Some password managers let you name someone who can ask for access, which you can refuse within a waiting period. Bitwarden calls this <a href="https://bitwarden.com/help/emergency-access/">Emergency Access</a>.</span></li>
  <li class="ok"><strong>Your password manager, with its master password sealed with your executor.</strong>
    <span>Write down only the one master password and the recovery kit, seal them, and leave them with your executor or solicitor, with your will. 1Password’s <a href="https://support.1password.com/emergency-kit/">Emergency Kit</a> is made for this.</span></li>
  <li class="warn"><strong>Written down.</strong>
    <span>The <a href="https://www.ncsc.gov.uk/collection/passwords/updating-your-approach">National Cyber Security Centre’s</a> concern is passwords written down “where they can be easily found”. Never on a note by the computer. If you must, sealed and kept with your executor.</span></li>
  <li class="bad"><strong>Only in your browser or Apple Keychain.</strong>
    <span>If you can’t be reached, no one can get them. Apple’s <a href="https://support.apple.com/en-gb/102631">Legacy Contact</a> gives family access to photos and files, but not to Keychain passwords.</span></li>
</ol>
<p><strong>A security key is not a password store.</strong> Keys such as <a href="https://www.yubico.com/products/">YubiKey</a> are a second way of proving it’s you. They hold no passwords, and if only you have one, they are another way to be locked out. Register a spare.</p>
<p><strong>To pass on a password once</strong>, use an encrypted link that expires, such as <a href="https://bitwarden.com/products/send/">Bitwarden Send</a> or a <a href="https://support.1password.com/share-items/">1Password share link</a>. Not email or a text message. The person receiving it doesn’t need an account, and should then save it in their own vault.</p>

<h2 id="own-vault">If you own the website: set up your own vault</h2>
<p>This is the most useful thing a website owner can do. Whoever sets up a vault owns it, so it needs to be you or someone in your organisation, not the person who built your site. Then you invite them in.</p>
<ol class="timeline checks">
  <li><div class="tl-text"><h3>Choose a password manager</h3><p>See the table below. Any of them is far better than none.</p></div></li>
  <li><div class="tl-text"><h3>Set it up in your organisation’s name</h3><p>Use an email address the organisation controls, such as office@, rather than someone’s personal one. Pay with the organisation’s card. If there’s a second person who should be able to get in, such as a trustee or partner, make them an admin too.</p></div></li>
  <li><div class="tl-text"><h3>Invite your web builder</h3><p>Add them as a member so they can add and update logins. You can remove them at any time, and the logins stay with you.</p></div></li>
  <li><div class="tl-text"><h3>Ask them to move the logins in</h3><p>The domain registrar, hosting, email, the website’s admin and any other services in your continuity plan, with each account’s recovery codes.</p></div></li>
  <li><div class="tl-text"><h3>Keep the way back in somewhere safe</h3><p>Print the recovery kit, such as 1Password’s <a href="https://support.1password.com/emergency-kit/">Emergency Kit</a>, and keep it with the organisation’s important papers, not on the computer.</p></div></li>
</ol>
<table class="svc-table">
  <thead><tr><th scope="col">If you are…</th><th scope="col">Use</th><th scope="col">Cost</th></tr></thead>
  <tbody>
    <tr><td>One person, and you and your builder both use Apple devices</td><td>A shared group in Apple’s <a href="https://support.apple.com/en-gb/guide/passwords/mchlc00a3602/mac">Passwords app</a>. You create the group, so only you can add or remove people. Everyone needs iOS 17 or macOS Sonoma or later, and your builder must be in your contacts.</td><td>Free</td></tr>
    <tr><td>One person, and not everyone uses Apple</td><td>A free <a href="https://bitwarden.com/help/about-organizations/">Bitwarden organisation</a>, which is just for two people: you and your builder.</td><td>Free</td></tr>
    <tr><td>A business, charity or club</td><td><a href="https://1password.com/business">1Password Teams</a> or <a href="https://bitwarden.com/products/business/">Bitwarden Teams</a>, with room for more people and an admin who can remove anyone who leaves.</td><td>Monthly. See <a href="https://1password.com/pricing/business">1Password’s</a> and <a href="https://bitwarden.com/pricing/business/">Bitwarden’s</a> prices</td></tr>
  </tbody>
</table>
<p><strong>If you build websites:</strong> ask each client to set up the vault and invite you. It can be tempting to create it in your own account and add the client as a guest, because it’s cheaper, but the vault would still be yours, and it would go if your account did.</p>

<h2>Two-step sign-in codes</h2>
<p>This is the most common way people get locked out: they have the password, but the code goes to a phone they don’t have.</p>
<ul class="checklist">
  <li>Add the client’s phone, or a second security key, to the domain registrar, hosting and email accounts.</li>
  <li>Save each account’s recovery codes in the shared vault.</li>
  <li>Check which sign-in methods each service offers on <a href="https://2fa.directory/">2FA Directory</a>.</li>
  <li>Turn on two-step sign-in wherever it isn’t on yet, starting with the domain registrar.</li>
</ul>

<h2 id="backups">Backups</h2>
<p>Keep three copies, on two different kinds of storage, with one away from the hosting company, and at least one in the client’s own account. Then, once a year, try restoring one. A backup no one has restored may not work.</p>
<table class="svc-table">
  <thead><tr><th scope="col">If the site is…</th><th scope="col">Back up</th><th scope="col">Where to</th></tr></thead>
  <tbody>
    <tr><td>Built from code (Astro, Vite, Next.js) and hosted on Vercel, Netlify or similar</td><td>The code. The repository is the backup.</td><td>A repository the client owns or can reach, such as a <a href="https://docs.github.com/en/organizations">GitHub organisation</a>, not only your own account</td></tr>
    <tr><td>Using a content editor or database (WordPress, Tina, Supabase, MediaWiki)</td><td>The content and the database, every night or week</td><td>The client’s own <a href="https://www.google.com/drive/">Google Drive</a>, <a href="https://www.dropbox.com/">Dropbox</a> or cloud storage such as <a href="https://www.backblaze.com/cloud-storage">Backblaze B2</a>, outside the hosting account</td></tr>
    <tr><td>Made with a site builder (Wix, Squarespace)</td><td>An export of pages, images and form entries, where the builder allows it</td><td>The client’s own storage</td></tr>
    <tr><td>Email</td><td>Usually nothing: the provider keeps it. Export a copy once a year if old mail matters</td><td>The client’s own storage</td></tr>
  </tbody>
</table>
<p>The host’s own backups are welcome but don’t count as the off-site copy: if the account is closed or unpaid, they go with it.</p>
<h3>How often, and how far back</h3>
<ul class="checklist">
  <li><strong>Automatic, not by hand.</strong> Copies made when someone remembers stop when people get busy.</li>
  <li><strong>Every day</strong> for a site whose content changes often, such as a wiki, shop or membership site. <strong>Every week</strong> is enough for one that rarely changes.</li>
  <li><strong>Keep at least a month of copies.</strong> A hack or mistake is often found days or weeks later. If only the latest copy is kept, the damage has already been copied over it.</li>
  <li><strong>Online and physical.</strong> A drive at home or in the office is a good second copy, but a fire, flood or theft takes it with the computer. Keep one copy online, in storage the client owns.</li>
</ul>

<h2>Expiry dates</h2>
<p>Domain names, certificates, hosting plans, app store memberships and API keys all run out. In Spare Key, give each service its renewal or expiry date, then use <strong>Add the dates to a calendar</strong> in step 06. Every date goes into your calendar, with reminders 30 days and 7 days before.</p>

<h2>Sources</h2>
<ul class="sources">
  <li><a href="https://www.ncsc.gov.uk/collection/passwords/updating-your-approach">National Cyber Security Centre: password guidance</a></li>
  <li><a href="https://support.apple.com/guide/iphone/share-passwords-iphe6b2b7043/ios">Apple: share passwords with people you trust</a></li>
  <li><a href="https://bitwarden.com/help/emergency-access/">Bitwarden: Emergency Access</a></li>
  <li><a href="https://support.1password.com/emergency-kit/">1Password: Emergency Kit</a></li>
  <li><a href="https://support.apple.com/en-gb/102631">Apple: Legacy Contact</a></li>
</ul>
<p class="sub">Spare Key never asks for a password, and never stores one. <a href="check.html">Check it yourself</a>.</p>
`];
