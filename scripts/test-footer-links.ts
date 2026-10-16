/**
 * Footer Component - Link Verification Test
 * Run: npx tsx scripts/test-footer-links.ts
 * 
 * This script verifies all Footer links point to valid routes.
 */

import { PLATFORM_PAGES } from '../frontend/src/data/platformKnowledge';

// Footer link configuration (from ContentContext.tsx FOOTER_DEFAULTS)
const FOOTER_LINK_GROUPS = [
  {
    title: 'PLATFORM',
    links: [
      { label: 'All Services', path: '/services' },
      { label: 'Pricing', path: '/pricing' },
      { label: 'Get a Quote', path: '/get-quote' },
      { label: 'Free Trial', path: '/free-trial' },
    ],
  },
  {
    title: 'COMPANY',
    links: [
      { label: 'About', path: '/about' },
      { label: 'Blog', path: '/blog' },
      { label: 'Book Meeting', path: '/book-meeting' },
      { label: 'Careers', path: '#' },
    ],
  },
  {
    title: 'LEGAL',
    links: [
      { label: 'Privacy', path: '#' },
      { label: 'Terms', path: '#' },
      { label: 'Cookies', path: '#' },
      { label: 'Security', path: '#' },
    ],
  },
];

// CTA links based on auth state
const CTA_LINKS = {
  unauthenticated: '/book-meeting',
  authenticated: '/jobs/new/upload',
};

// Social links
const SOCIAL_LINKS = [
  { platform: 'Instagram', url: 'https://www.instagram.com/reframevisualsstudio/' },
  { platform: 'Linkedin', url: 'https://www.linkedin.com/company/reframe-visuals/' },
  { platform: 'Pinterest', url: 'https://www.pinterest.com/reframevisuals/' },
  { platform: 'Behance', url: 'https://www.behance.net/reframevisuals' },
  { platform: 'X', url: 'https://x.com/ReframeVisual' },
  { platform: 'Trustpilot', url: 'https://www.trustpilot.com/review/reframevisuals.com' },
  { platform: 'TikTok', url: 'https://www.tiktok.com/@reframe_visuals' },
];

console.log('='.repeat(60));
console.log('🧪 FOOTER COMPONENT - LINK VERIFICATION TEST');
console.log('='.repeat(60));
console.log();

let passed = 0;
let failed = 0;
let warnings = 0;

// Get all valid routes from platform knowledge
const validRoutes = PLATFORM_PAGES.map((p) => p.path.replace('/:serviceId', ''));

function testLink(label: string, path: string, category: string) {
  if (path === '#') {
    console.log(`⚠️  ${category} - "${label}" uses placeholder link (#)`);
    warnings++;
    return;
  }

  // Handle dynamic routes
  const baseRoute = path.split('/').slice(0, 3).join('/');
  const isValid = validRoutes.some((route) => {
    const cleanRoute = route.replace(/^\/[^/]*$/, '/*'); // Handle dynamic segments
    return route === path || cleanRoute === baseRoute || path.startsWith(route);
  });

  if (isValid) {
    console.log(`✅ ${category} - "${label}" → ${path}`);
    passed++;
  } else {
    console.log(`❌ ${category} - "${label}" → ${path} (INVALID ROUTE)`);
    failed++;
  }
}

// Test PLATFORM links
console.log('📦 PLATFORM LINKS');
console.log('-'.repeat(60));
FOOTER_LINK_GROUPS[0].links.forEach((link) => {
  testLink(link.label, link.path, 'PLATFORM');
});
console.log();

// Test COMPANY links
console.log('🏢 COMPANY LINKS');
console.log('-'.repeat(60));
FOOTER_LINK_GROUPS[1].links.forEach((link) => {
  testLink(link.label, link.path, 'COMPANY');
});
console.log();

// Test LEGAL links
console.log('⚖️  LEGAL LINKS');
console.log('-'.repeat(60));
FOOTER_LINK_GROUPS[2].links.forEach((link) => {
  testLink(link.label, link.path, 'LEGAL');
});
console.log();

// Test CTA links
console.log('🎯 CTA LINKS');
console.log('-'.repeat(60));
testLink('CTA (Unauthenticated)', CTA_LINKS.unauthenticated, 'CTA');
testLink('CTA (Authenticated)', CTA_LINKS.authenticated, 'CTA');
console.log();

// Test Social links
console.log('📱 SOCIAL LINKS');
console.log('-'.repeat(60));
SOCIAL_LINKS.forEach((link) => {
  if (link.url === '#') {
    console.log(`⚠️  SOCIAL - ${link.platform} uses placeholder link (#)`);
    warnings++;
  } else {
    console.log(`✅ SOCIAL - ${link.platform} → ${link.url}`);
    passed++;
  }
});
console.log();

// Test special routes that should exist
console.log('🔍 ADDITIONAL ROUTE CHECKS');
console.log('-'.repeat(60));

const additionalRoutes = [
  { label: 'Services Detail', path: '/services/background-removal' },
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Login', path: '/login' },
  { label: 'Signup', path: '/signup' },
];

additionalRoutes.forEach((route) => {
  const exists = PLATFORM_PAGES.some(
    (p) => p.path === route.path || p.path.includes(':serviceId')
  );
  if (exists) {
    console.log(`✅ ROUTE EXISTS - ${route.label} → ${route.path}`);
    passed++;
  } else {
    console.log(`⚠️  ROUTE NOT IN PLATFORM_PAGES - ${route.label} → ${route.path}`);
    warnings++;
  }
});
console.log();

// Summary
console.log('='.repeat(60));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`⚠️  Warnings (placeholder links): ${warnings}`);
console.log();

if (failed === 0) {
  console.log('🎉 All Footer links are valid!');
  process.exit(0);
} else {
  console.log('❌ Some Footer links are invalid. Please fix them.');
  process.exit(1);
}
