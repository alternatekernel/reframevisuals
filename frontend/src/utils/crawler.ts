/**
 * Crawler / prerender detection shared by presentational components that
 * animate content humans should see moving but crawlers must read statically
 * (count-up stats, infinite marquees, etc.).
 *
 * The pattern matches scripts/prerender.mjs's Playwright user agent
 * ("Googlebot ... reframe-crawler") as well as real search/social crawlers,
 * so build-time prerendered HTML captures the final, fully-readable state.
 */
export const BOT_UA_PATTERN =
  /bot|crawler|spider|crawling|slurp|bingpreview|lighthouse|pagespeed|headless|facebookexternalhit|whatsapp|linkedinbot|twitterbot|discordbot|google-read-aloud/i;

export const isLikelyCrawler = (): boolean => {
  // Server-side rendering has no navigator; treat it like a crawler so SSR
  // output is the static, fully-readable variant.
  if (typeof navigator === 'undefined') return true;
  return BOT_UA_PATTERN.test(navigator.userAgent || '');
};
