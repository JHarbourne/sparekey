// "Read my project": recognise how a website is built from its project files.
// Runs in the browser. Files are read locally and never sent anywhere. From an
// environment file only the variable NAMES are kept; values are discarded.

import { newService } from './model.js';

// Packages that say how the site is built. [package or prefix, label]
const STACK = [
  ['astro', 'Astro'], ['vite', 'Vite'], ['next', 'Next.js'], ['nuxt', 'Nuxt'], ['@sveltejs/kit', 'SvelteKit'],
  ['svelte', 'Svelte'], ['gatsby', 'Gatsby'], ['@11ty/eleventy', 'Eleventy'], ['vue', 'Vue'], ['react', 'React'],
  ['@angular/core', 'Angular'], ['@remix-run/', 'Remix'], ['express', 'Express'], ['vite-plugin-pwa', 'Installable web app (PWA)'],
  ['@capacitor/core', 'Capacitor (phone app)'], ['leaflet', 'Leaflet maps'], ['tailwindcss', 'Tailwind CSS'], ['@vercel/node', 'Vercel functions'],
];

// Packages that mean an account somewhere. [package or prefix, service name, kind, what it does]
const SERVICES = [
  ['tinacms', 'Tina CMS', 'cms', 'Where the site’s content is edited.'],
  ['@tinacms/', 'Tina CMS', 'cms', 'Where the site’s content is edited.'],
  ['decap-cms', 'Decap CMS', 'cms', 'Content editing, saved into the code repository.'],
  ['sanity', 'Sanity', 'cms', 'Where the site’s content is edited and stored.'],
  ['@sanity/', 'Sanity', 'cms', 'Where the site’s content is edited and stored.'],
  ['contentful', 'Contentful', 'cms', 'Where the site’s content is edited and stored.'],
  ['@storyblok/', 'Storyblok', 'cms', 'Where the site’s content is edited and stored.'],
  ['posthog-js', 'PostHog', 'analytics', 'Counts how the site is used.'],
  ['posthog-node', 'PostHog', 'analytics', 'Counts how the site is used.'],
  ['@vercel/analytics', 'Vercel Analytics', 'analytics', 'Counts visits.'],
  ['plausible-tracker', 'Plausible', 'analytics', 'Counts visits.'],
  ['@sentry/', 'Sentry', 'other', 'Reports errors on the site.'],
  ['mapbox-gl', 'Mapbox', 'api', 'Map tiles. Needs an access token.'],
  ['@googlemaps/', 'Google Maps Platform', 'api', 'Maps. Needs an API key and a billing account.'],
  ['@react-google-maps/api', 'Google Maps Platform', 'api', 'Maps. Needs an API key and a billing account.'],
  ['@supabase/supabase-js', 'Supabase', 'database', 'Database, sign-in or file storage.'],
  ['firebase', 'Firebase', 'database', 'Database, sign-in or hosting.'],
  ['stripe', 'Stripe', 'other', 'Takes payments.'],
  ['@stripe/', 'Stripe', 'other', 'Takes payments.'],
  ['@getbrevo/', 'Brevo', 'sending', 'Sends email or newsletters.'],
  ['sib-api-v3-sdk', 'Brevo', 'sending', 'Sends email or newsletters.'],
  ['resend', 'Resend', 'sending', 'Sends email from the site.'],
  ['@sendgrid/', 'SendGrid', 'sending', 'Sends email from the site.'],
  ['postmark', 'Postmark', 'sending', 'Sends email from the site.'],
  ['mailgun.js', 'Mailgun', 'sending', 'Sends email from the site.'],
  ['@mailchimp/', 'Mailchimp', 'sending', 'Newsletters.'],
  ['algoliasearch', 'Algolia', 'api', 'Site search.'],
  ['@clerk/', 'Clerk', 'other', 'Sign-in for users.'],
  ['@auth0/', 'Auth0', 'other', 'Sign-in for users.'],
  ['cloudinary', 'Cloudinary', 'other', 'Stores and resizes images.'],
  ['@aws-sdk/', 'Amazon Web Services', 'other', 'Cloud services used by the site.'],
  ['openai', 'OpenAI API', 'api', 'AI features. Billed per use.'],
  ['@anthropic-ai/sdk', 'Anthropic API', 'api', 'AI features. Billed per use.'],
  ['twilio', 'Twilio', 'api', 'Text messages or calls.'],
];

// Environment variable prefixes that belong to a known service.
const ENV_SERVICES = [
  [/SUPABASE/, 'Supabase', 'database'], [/POSTHOG/, 'PostHog', 'analytics'], [/STRIPE/, 'Stripe', 'other'],
  [/BREVO|SENDINBLUE/, 'Brevo', 'sending'], [/RESEND/, 'Resend', 'sending'], [/SENDGRID/, 'SendGrid', 'sending'],
  [/MAPBOX/, 'Mapbox', 'api'], [/GOOGLE_MAPS/, 'Google Maps Platform', 'api'], [/SENTRY/, 'Sentry', 'other'],
  [/TINA/, 'Tina CMS', 'cms'], [/OPENAI/, 'OpenAI API', 'api'], [/ANTHROPIC/, 'Anthropic API', 'api'],
  [/CLOUDINARY/, 'Cloudinary', 'other'], [/ALGOLIA/, 'Algolia', 'api'], [/FIREBASE/, 'Firebase', 'database'],
  [/TWILIO/, 'Twilio', 'api'], [/MAILCHIMP/, 'Mailchimp', 'sending'], [/^AWS_|_AWS_/, 'Amazon Web Services', 'other'],
];
const NOT_SECRET = /^(NODE_ENV|PORT|HOST|BASE_URL|SITE_URL|PUBLIC_URL|DEBUG|TZ|LANG|CI)$/;
const SECRETISH = /(KEY|TOKEN|SECRET|PASSWORD|PASS|API|DSN|CLIENT_ID|WEBHOOK)/;

const ACRONYMS = new Set(['API', 'URL', 'AWS', 'ID', 'DSN', 'SMTP', 'CMS', 'JWT', 'OAUTH']);
function humanise(name) {
  return name.replace(/^(VITE|NEXT_PUBLIC|PUBLIC|NUXT|REACT_APP|GATSBY)_/, '').split('_').filter(Boolean)
    .map((w) => (ACRONYMS.has(w) ? w : w.charAt(0) + w.slice(1).toLowerCase())).join(' ');
}

// Names of variables in an environment file. Values are never returned.
export function envNames(text) {
  const names = []; let hadValues = false;
  for (const line of String(text).split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    if (!names.includes(m[1])) names.push(m[1]);
    const v = m[2].trim().replace(/^["']|["']$/g, '');
    if (v && !/^(your|xxx|changeme|<|\.\.\.|example|placeholder|replace)/i.test(v)) hadValues = true;
  }
  return { names, hadValues };
}

const matches = (pkg, key) => (key.endsWith('/') ? pkg.startsWith(key) : pkg === key);

// files: [{ name, text }]. Returns what was recognised; nothing is stored here.
export function readProject(files) {
  const stack = []; const found = new Map(); const keys = []; const warnings = []; let hosting = null;
  const addService = (name, kind, purpose, note) => {
    const s = found.get(name) || { name, kind, purpose, keys: [] };
    if (note && !s.keys.includes(note)) s.keys.push(note);
    found.set(name, s);
  };
  for (const f of files) {
    const base = f.name.split('/').pop().toLowerCase();
    if (base === 'package.json') {
      let pkg; try { pkg = JSON.parse(f.text); } catch { warnings.push('package.json could not be read.'); continue; }
      const deps = Object.keys({ ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) });
      for (const [key, label] of STACK) if (deps.some((d) => matches(d, key)) && !stack.includes(label)) stack.push(label);
      for (const [key, name, kind, purpose] of SERVICES) if (deps.some((d) => matches(d, key))) addService(name, kind, purpose);
    } else if (base.startsWith('.env') || base.endsWith('.env')) {
      const { names, hadValues } = envNames(f.text);
      if (hadValues) warnings.push(`${f.name} looked like it held real secrets. Only the names were read and the values were thrown away. Don’t share that file.`);
      for (const n of names) {
        if (NOT_SECRET.test(n)) continue;
        const known = ENV_SERVICES.find(([re]) => re.test(n));
        if (known) addService(known[1], known[2], '', n);
        else if (SECRETISH.test(n)) keys.push(n);
      }
    } else if (base === 'vercel.json') hosting = 'Vercel';
    else if (base === 'netlify.toml') hosting = 'Netlify';
    else if (base === 'wrangler.toml') hosting = 'Cloudflare';
    else if (base === 'firebase.json') hosting = 'Firebase Hosting';
    else if (/^astro\.config\./.test(base) && !stack.includes('Astro')) stack.push('Astro');
  }
  // Group loose keys by service, e.g. GOOGLE_BOOKS_API_KEY -> "Google Books API key".
  for (const k of keys) {
    const label = humanise(k).replace(/\s+(Key|Token|Secret)$/i, (m) => m.toLowerCase());
    addService(label, 'api', 'An API key or token the site uses. Record who owns the account and when it expires.', k);
  }
  return { stack, hosting, services: [...found.values()], warnings };
}

// Turn what was recognised into services for the inventory.
export function servicesFromProject(result, domain = '') {
  return result.services.map((s) => newService({
    kind: s.kind, domain, source: 'project', name: s.name, provider: s.name.replace(/ (API )?(key|token|secret)$/i, ''),
    purpose: s.purpose || 'Used by the site.',
    notes: s.keys.length ? `Set in the site’s settings as ${s.keys.join(', ')}. The value isn’t recorded here.` : '',
  }));
}
