// ─── Reframe AI Platform Knowledge Base ───
// Single source of truth for the chatbot's understanding of the platform.
// UPDATE THIS FILE whenever new pages, routes, flows, or features are added.

export interface PlatformPage {
  path: string;
  title: string;
  description: string;
  howToAccess: string[];
  keyActions: string[];
  relatedPages: string[];
  requiresAuth: boolean;
}

export interface UserFlow {
  id: string;
  name: string;
  steps: { label: string; path: string; description: string }[];
  entryPoints: string[];
}

// ─── All Platform Pages ───
// Every route the chatbot should know about and be able to navigate users to.

export const PLATFORM_PAGES: PlatformPage[] = [
  {
    path: '/',
    title: 'Home',
    description: 'Landing page with hero, services overview, workflow, stats, pricing teaser, and FAQ.',
    howToAccess: ['Click the Reframe Visual logo in the navigation bar'],
    keyActions: ['Explore services', 'View pricing teaser', 'Read FAQ', 'Get a quote', 'Start free trial'],
    relatedPages: ['/services', '/pricing', '/free-trial'],
    requiresAuth: false,
  },
  {
    path: '/services',
    title: 'Services',
    description: 'Full listing of all 19 expert image editing services across 4 categories: Foundation, Enhancement, Retouch, and Advanced.',
    howToAccess: ['Click "Services" in the navigation bar'],
    keyActions: ['Browse all 19 services', 'Hover for service previews', 'Click to view service details'],
    relatedPages: ['/services/background-removal', '/pricing'],
    requiresAuth: false,
  },
  {
    path: '/services/:serviceId',
    title: 'Service Detail',
    description: 'Detailed view of a specific service including description, pricing tiers, turnaround times, and related services.',
    howToAccess: ['Go to Services page', 'Click on any service pill'],
    keyActions: ['View pricing for all complexity tiers', 'See turnaround options', 'Start free trial for this service', 'Get a quote'],
    relatedPages: ['/services', '/pricing', '/free-trial'],
    requiresAuth: false,
  },
  {
    path: '/pricing',
    title: 'Pricing',
    description: 'Full pricing matrix for all services, bundles, and turnaround speeds. Starting at $0.19/image. No subscription required.',
    howToAccess: ['Click "Pricing" in the navigation bar'],
    keyActions: ['Compare service pricing', 'View bundles and savings', 'Calculate custom pricing', 'Start free trial'],
    relatedPages: ['/services', '/free-trial'],
    requiresAuth: false,
  },
  {
    path: '/about',
    title: 'About',
    description: 'About Reframe Visual - our values: Transparency, Human Craft, Quality Obsessed, Your Timeline.',
    howToAccess: ['Click "About" in the navigation bar'],
    keyActions: ['Learn about brand values', 'Understand the Reframe difference'],
    relatedPages: ['/services', '/pricing', '/book-meeting'],
    requiresAuth: false,
  },
  {
    path: '/blog',
    title: 'Blog & Answers',
    description: 'FAQ page with detailed answers about turnaround, payments, revisions, file formats, security, and integrations.',
    howToAccess: ['Click "Blog" in the navigation bar'],
    keyActions: ['Read FAQs', 'Learn about policies', 'Understand integrations'],
    relatedPages: ['/services', '/pricing', '/book-meeting'],
    requiresAuth: false,
  },
  {
    path: '/free-trial',
    title: 'Free Trial',
    description: 'Start a free trial - get 3 image edits at no cost. 24-hour turnaround guaranteed. No credit card required.',
    howToAccess: ['Click "Get Your Free Trial" or "Start Free" buttons throughout the site'],
    keyActions: ['Submit free trial request', 'Get 3 free image edits'],
    relatedPages: ['/signup'],
    requiresAuth: false,
  },
  {
    path: '/book-meeting',
    title: 'Book a Meeting',
    description: 'Schedule a 30-minute walkthrough call with the Reframe systems team. Free, no commitment.',
    howToAccess: ['Click "Book Meeting" in the Company section of the footer', 'Navigate directly'],
    keyActions: ['Schedule a call', 'Select a time slot', 'Receive confirmation'],
    relatedPages: ['/free-trial', '/about'],
    requiresAuth: false,
  },
  {
    path: '/signup',
    title: 'Sign Up',
    description: 'Create a Reframe Visual account to access the platform dashboard and place orders.',
    howToAccess: ['Click signup/login in the navigation'],
    keyActions: ['Create an account', 'Set up profile'],
    relatedPages: ['/login', '/dashboard'],
    requiresAuth: false,
  },
  {
    path: '/login',
    title: 'Log In',
    description: 'Log in to your Reframe Visual account to access the dashboard, manage jobs, and place orders.',
    howToAccess: ['Click login in the navigation'],
    keyActions: ['Log in with credentials', 'Access dashboard'],
    relatedPages: ['/signup', '/dashboard'],
    requiresAuth: false,
  },
  {
    path: '/dashboard',
    title: 'Dashboard',
    description: 'User dashboard - view active jobs, order history, and start new orders.',
    howToAccess: ['Log in first', 'Click "Dashboard" in the navigation'],
    keyActions: ['View active jobs', 'Start a new order', 'Track job progress', 'Manage account'],
    relatedPages: ['/dashboard?view=new-project', '/account'],
    requiresAuth: true,
  },
  {
    path: '/account',
    title: 'Account Settings',
    description: 'Manage your profile, preferences, and account settings.',
    howToAccess: ['Log in first', 'Click your profile in the navigation', 'Select "Account"'],
    keyActions: ['Update profile', 'Manage preferences', 'View account details'],
    relatedPages: ['/dashboard'],
    requiresAuth: true,
  },
  {
    path: '/dashboard?view=new-project',
    title: 'New Project',
    description: 'Start a new order within the dashboard. Upload assets, set requirements, review specs, and submit · all in one integrated flow.',
    howToAccess: ['Log in first', 'Go to Dashboard', 'Click "New Project" in the sidebar'],
    keyActions: ['Upload images', 'Set technical requirements', 'Review and submit order'],
    relatedPages: ['/dashboard', '/services'],
    requiresAuth: true,
  },

];

// ─── User Flows ───
// Step-by-step flows the chatbot can guide users through.

export const USER_FLOWS: UserFlow[] = [
  {
    id: 'place-order',
    name: 'Place a New Order',
    steps: [
      { label: 'Sign Up or Log In', path: '/login', description: 'Create an account or log in to access the platform.' },
      { label: 'Go to Dashboard', path: '/dashboard', description: 'Your central hub for managing all jobs.' },
      { label: 'Start New Job', path: '/dashboard?view=new-project', description: 'Click "New Project" in the sidebar and upload your images, set requirements, and submit.' },
      { label: 'Review & Submit', path: '/dashboard?view=new-project', description: 'Review your specs and pricing, then submit your order.' },
    ],
    entryPoints: ['/dashboard', '/services', '/pricing'],
  },
  {
    id: 'start-free-trial',
    name: 'Start Free Trial',
    steps: [
      { label: 'Go to Free Trial', path: '/free-trial', description: 'Navigate to the free trial page.' },
      { label: 'Submit Request', path: '/free-trial', description: 'Fill in your details and describe what you need.' },
      { label: 'Receive Edits', path: '/free-trial', description: 'Get 3 free image edits within 24 hours. No credit card required.' },
    ],
    entryPoints: ['/', '/services', '/pricing'],
  },
  {
    id: 'book-meeting',
    name: 'Book a Meeting',
    steps: [
      { label: 'Go to Book Meeting', path: '/book-meeting', description: 'Navigate to the meeting scheduler.' },
      { label: 'Select a Time', path: '/book-meeting', description: 'Choose a 30-minute slot that works for you.' },
      { label: 'Confirm', path: '/book-meeting', description: 'Confirm your booking. You will receive a confirmation within 24 hours.' },
    ],
    entryPoints: ['/about', '/pricing', '/'],
  },
];

// ─── Platform Policies ───
// Key policies the chatbot should reference when answering questions.

export const PLATFORM_POLICIES = {
  fileFormats: {
    accepted: ['JPG', 'PNG', 'TIFF', 'PSD'],
    maxFileSize: '50MB per file',
    maxBatchSize: '100 images per job',
  },
  turnaround: {
    options: ['12h (Lightning)', '24h (Standard)', '48h (Relaxed)', '72h (Economy)', '7-day (Saver)'],
  },
  pricing: {
    startingAt: '$0.39/image',
    subscription: 'No subscription required',
    volumeDiscount: '5% off for 100+ images per order',
    enterprise: 'Custom rates for 500+ images/month',
  },
  revisions: {
    policy: 'Unlimited revisions included with every order at no extra cost',
    howTo: 'Use precision annotation tools directly on the image to mark exactly what to fix. Resolved within your turnaround window.',
  },
  payment: {
    model: 'Review-first - inspect side-by-side comparisons before any approval',
    whenToPay: 'After you approve the edited images',
  },
  security: {
    compliance: 'Files handled under strict access controls',
    encryption: 'All files encrypted in transit and at rest',
    sharing: 'We never share your assets with third parties',
  },
  integrations: {
    available: ['Google Drive', 'Dropbox', 'OneDrive', 'Direct Upload'],
    comingSoon: ['Storefront', 'Amazon', 'App Automation'],
  },
  freeTrial: {
    offer: '3 free image edits',
    turnaround: '24 hours',
    creditCard: 'Not required',
  },
};

// ─── Quick Navigation Map ───
// Used by the chatbot to generate clickable links in responses.

export const QUICK_LINKS: Record<string, { label: string; path: string }> = {
  home: { label: 'Home', path: '/' },
  services: { label: 'All Services', path: '/services' },
  pricing: { label: 'Pricing', path: '/pricing' },
  bookMeeting: { label: 'Book a Meeting', path: '/book-meeting' },
  freeTrial: { label: 'Free Trial', path: '/free-trial' },
  about: { label: 'About Us', path: '/about' },
  insights: { label: 'Blog & FAQ', path: '/blog' },
  signup: { label: 'Sign Up', path: '/signup' },
  login: { label: 'Log In', path: '/login' },
  dashboard: { label: 'Dashboard', path: '/dashboard' },
  newJob: { label: 'Start New Order', path: '/dashboard?view=new-project' },
  account: { label: 'Account Settings', path: '/account' },
};

// ─── Helper: Find the best link for a given intent ───
export const getLinkForIntent = (intent: string): { label: string; path: string } | null => {
  const lower = intent.toLowerCase();
  if (lower.includes('price') || lower.includes('cost') || lower.includes('pricing')) return QUICK_LINKS.pricing;
  if (lower.includes('service') && (lower.includes('all') || lower.includes('list') || lower.includes('browse'))) return QUICK_LINKS.services;
  if (lower.includes('quote') || lower.includes('estimate') || lower.includes('book') || lower.includes('meeting')) return QUICK_LINKS.bookMeeting;
  if (lower.includes('free') || lower.includes('trial')) return QUICK_LINKS.freeTrial;
  if (lower.includes('call') || lower.includes('schedule')) return QUICK_LINKS.bookMeeting;
  if (lower.includes('order') || lower.includes('job') || lower.includes('new edit') || lower.includes('place')) return QUICK_LINKS.newJob;
  if (lower.includes('dashboard') || lower.includes('jobs')) return QUICK_LINKS.dashboard;
  if (lower.includes('sign up') || lower.includes('register') || lower.includes('create account')) return QUICK_LINKS.signup;
  if (lower.includes('log in') || lower.includes('login') || lower.includes('sign in')) return QUICK_LINKS.login;
  if (lower.includes('about')) return QUICK_LINKS.about;
  if (lower.includes('faq') || lower.includes('question') || lower.includes('insight')) return QUICK_LINKS.insights;
  return null;
};
