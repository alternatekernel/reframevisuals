// @ts-check
import { defineConfig } from 'astro/config'
import vercel from '@astrojs/vercel/serverless'
import tailwind from '@astrojs/tailwind'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import react from '@astrojs/react'

export default defineConfig({
  site: 'https://reframevisuals.com',
  output: 'server',
  adapter: vercel({
    webAnalytics: { enabled: true },
    imageService: true,
  }),
  integrations: [
    tailwind(),
    mdx(),
    react(),
    sitemap({
      filter: (page) =>
        !page.includes('/api/') &&
        !page.includes('/dashboard') &&
        !page.includes('/jobs/'),
      serialize(item) {
        if (item.url === 'https://reframevisuals.com/') return { ...item, changefreq: 'weekly', priority: 1.0 }
        if (item.url.includes('/services/')) return { ...item, changefreq: 'monthly', priority: 0.9 }
        if (item.url.includes('/blog/')) return { ...item, changefreq: 'yearly', priority: 0.7 }
        if (item.url.includes('/case-studies/')) return { ...item, changefreq: 'yearly', priority: 0.8 }
        return { ...item, changefreq: 'monthly', priority: 0.6 }
      },
    }),
  ],
  redirects: {
    '/blog/series/[seriesSlug]': '/blog',
    '/blog/topic/[topicSlug]':   '/blog',
    '/reframe-visuals-services': '/services',
    '/about-reframe-visuals':    '/about',
    '/privacy':                  '/legal/privacy',
    '/terms':                    '/legal/terms',
    '/cookies':                  '/legal/cookies',
  },
})
