// Privacy-first usage counts with PostHog.
//
// - Does nothing until POSTHOG_KEY is set.
// - Cookieless: PostHog stores nothing in cookies, localStorage or sessionStorage.
//   (Also turn on "Cookieless server hash mode" in the PostHog project settings.)
// - No person profiles, no autocapture, no session recording, no surveys, no flags.
// - EU hosting. Respects Do Not Track.
// - Only the named events below are sent, with counts. Never domain names,
//   client names or anything typed into the page.

export const POSTHOG_KEY = 'phc_v3jCk9GVQ8Sudie94YbQKPW6jQz7iYXFoea2LZeAm8j7'; // Spare Key project, EU cloud. A public, write-only key.
const API_HOST = 'https://eu.i.posthog.com';

const ALLOWED = new Set([
  'get_started', 'request_created', 'request_opened', 'lookup_completed', 'lookup_failed', 'service_added',
  'handover_downloaded', 'inventory_saved', 'inventory_opened', 'theme_changed', 'all_clear', 'old_address_checked', 'project_read', 'calendar_downloaded',
  'step_moved', 'survey_offered', 'survey_opened', 'survey_declined', 'wordpress_read',
]);

let ready = false;

export function initAnalytics() {
  if (!POSTHOG_KEY || ready || typeof window === 'undefined') return;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
  // Automated browsers (our own tests, bots) are never counted.
  if (navigator.webdriver) return;
  /* eslint-disable */
  // Official PostHog loader snippet (moved here because the page's CSP forbids inline scripts).
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
  /* eslint-enable */
  window.posthog.init(POSTHOG_KEY, {
    api_host: API_HOST,
    cookieless_mode: 'always',
    person_profiles: 'never',
    autocapture: false,
    capture_pageview: true,
    capture_pageleave: false,
    disable_session_recording: true,
    disable_surveys: true,
    advanced_disable_feature_flags: true,
    respect_dnt: true,
    mask_all_text: true,
    mask_all_element_attributes: true,
    // Belt and braces: never send query strings or #fragments (a request link
    // carries a client's name in its fragment).
    before_send: (event) => {
      if (!event || !event.properties) return event;
      for (const k of ['$current_url', '$referrer', '$initial_current_url', '$initial_referrer']) {
        const v = event.properties[k];
        if (typeof v === 'string') { try { const u = new URL(v); event.properties[k] = u.origin + u.pathname; } catch { delete event.properties[k]; } }
      }
      return event;
    },
  });
  ready = true;
}

// props must be numbers or booleans only, so nothing identifying can slip through.
export function track(event, props = {}) {
  if (!ready || !ALLOWED.has(event) || !window.posthog) return;
  const safe = {};
  for (const [k, v] of Object.entries(props)) if (typeof v === 'number' || typeof v === 'boolean') safe[k] = v;
  try { window.posthog.capture(event, safe); } catch { /* never break the page */ }
}
