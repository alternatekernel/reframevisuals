export interface TestimonialItem {
  quote: string;
  name: string;
  company: string;
  metric?: string;
  avatarUrl?: string;
  username?: string;
}

export const TESTIMONIALS: TestimonialItem[] = [

  // ── Row 1: Founders & brand owners ──────────────────────────────────────────

  {
    quote: 'Great communication, very efficient and excellent job every time. Handled everything exceptionally and went above and beyond.',
    name: 'Suril',
    company: 'Founder, Acia Studio',
    metric: '2× repeat client',
    avatarUrl: 'https://res.cloudinary.com/dnmj4altq/image/upload/v1781723564/reframeimages/testimonials/surreal_founder_portrait.jpg',
    username: '@surreal616',
  },
  {
    quote: 'Prompt and quality work. I look forward to working with Reframe many times in the future.',
    name: 'Todd Carli',
    company: 'Owner, Todd Carli Custom Carpentry',
    avatarUrl: 'https://res.cloudinary.com/dnmj4altq/image/upload/v1781723566/reframeimages/testimonials/todd_carli_portrait.jpg',
    username: '@toddcarli',
  },

  {
    quote: "Amazing job, as always. Third time repeat customer. Very responsive and always overdelivers!",
    name: 'Jamie',
    company: 'Founder, The Pup Pack',
    metric: '3× repeat client',
    avatarUrl: 'https://res.cloudinary.com/dnmj4altq/image/upload/v1781723550/reframeimages/testimonials/jamie_puppack_portrait.jpg',
    username: '@puppack',
  },
  {
    quote: 'As always, good job. Nice work as always.',
    name: 'Sam Lim',
    company: 'Founder, E-commerce Brand',
    avatarUrl: 'https://res.cloudinary.com/dnmj4altq/image/upload/v1781723560/reframeimages/testimonials/sam_lim_portrait.jpg',
    username: '@samlim111',
  },
  {
    quote: 'Appreciate the prompt work and reply.',
    name: 'Sol',
    company: 'Owner, Sol Photography',
    avatarUrl: 'https://res.cloudinary.com/dnmj4altq/image/upload/v1781723562/reframeimages/testimonials/sol_photographer_portrait.jpg',
    username: '@photographersol',
  },
  {
    quote: "They did their best, I'm happy with the work. Fast work and great results.",
    name: 'Gino',
    company: 'Founder, Jewelry Brand',
    avatarUrl: 'https://res.cloudinary.com/dnmj4altq/image/upload/v1781723548/reframeimages/testimonials/gino_jeweler_portrait.jpg',
    username: '@ginosherylkwida',
  },

  // ── Nikola Filić — Spotlight card only, filtered from marquee ───────────────

  {
    quote: 'Probably the best seller I have worked with on this platform. Awesome pricing & highest possible result. Everything done to the smallest details. They really know how to use PS. Will definitely work with them in the long run.',
    name: 'Nikola Filić',
    company: 'Founder, Bomber Clothing',
    avatarUrl: 'https://res.cloudinary.com/dnmj4altq/image/upload/v1781971885/reframe/testimonials/nikola_filic_portrait.jpg',
  },


  // ── Row 2: Other clients ─────────────────────────────────────────────────────

  {
    quote: "The best in the game when it comes to getting work done. Humble, understanding, and consistently on point.",
    name: 'Nigel',
    company: 'Owner, Fashion Retail',
    metric: '5× repeat client',
    avatarUrl: 'https://res.cloudinary.com/dnmj4altq/image/upload/v1781723555/reframeimages/testimonials/nigel_fashion_portrait.jpg',
    username: '@nigelison',
  },
  {
    quote: 'Very efficient and communicated quickly and effectively.',
    name: 'MisterBuza',
    company: 'Founder, Online Retailer',
    avatarUrl: 'https://res.cloudinary.com/dnmj4altq/image/upload/v1781723553/reframeimages/testimonials/misterbuza_portrait.jpg',
    username: '@misterbuza',
  },
];
