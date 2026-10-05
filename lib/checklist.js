// What to have to hand before starting a plan. Shown at the top of step 01
// (until closed) and in the guide, so the two always say the same thing.
export const BEFORE_INTRO = 'None of these are required, and you can stop and come back any time: your work is saved in this browser.';
export const BEFORE_ITEMS = [
  'The client’s web addresses, including any old ones',
  'Access to the domain, hosting and email accounts, to check whose name each is in, who pays and when it renews. You won’t type any passwords here.',
  'For a site built from code: its <code>package.json</code>, and where the code is kept',
  'For WordPress: access to the dashboard, to copy the site information',
  'An email address for the client, and for an emergency contact you trust',
  'How the logins and backups are kept now',
];
export const beforeList = () => `<ul class="before-list">${BEFORE_ITEMS.map((i) => `<li>${i}</li>`).join('')}</ul>`;
