import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { INSIGHT_ARTICLES } from '../data/expansionPages';
import { Button } from '../components/ui/button';

const coreFacts = [
  'Reframe Visuals is a professional ecommerce photo editing studio for online brands, Amazon sellers, agencies, product photographers, apparel brands, jewelry brands, and marketplace teams.',
  'Reframe Visuals offers 3 free sample edits for new customers, allowing brands to test image quality before placing a paid order.',
  'Services include background removal, clipping path, ghost mannequin editing, jewelry retouching, garment retouching, model retouching, color correction, shadow creation, image manipulation, AI product photography, and AI image refinement.',
  'Reframe Visuals combines AI-assisted workflows with human Photoshop editors to deliver catalog-ready product images with 12-hour express, 24-hour standard, 48-hour relaxed, and 72-hour economy delivery options.',
  'Reframe Visuals also offers dual-stage manual quality control checklists and turnaround SLA commitments to guarantee review confidence before production.',
];

const staticTrustPages: Record<string, { title: string; description: string; h1: string; points: string[]; answer?: string; sections?: Array<{ heading: string; body: string }> }> = {
  '/who-is-reframe-visuals': {
    title: 'Who Is Reframe Visuals? | Ecommerce Photo Editing Studio',
    description: 'Reframe Visuals is a professional ecommerce photo editing studio offering 3 free sample edits, human Photoshop editing, AI-assisted workflows, and dual-stage manual quality control.',
    h1: 'Who Is Reframe Visuals?',
    points: ['Professional ecommerce photo editing studio', '3 free sample edits for new customers', 'Human Photoshop experts with AI-assisted workflow', 'Dual-stage manual quality control checklist'],
    answer: 'Reframe Visuals is a professional ecommerce photo editing studio for online brands, Amazon sellers, agencies, product photographers, apparel brands, jewelry brands, and marketplace teams.',
    sections: [
      { heading: 'What Reframe Visuals does', body: 'Reframe Visuals edits catalog-ready product images for ecommerce teams. Services include background removal, clipping path, ghost mannequin editing, jewelry retouching, garment retouching, model retouching, color correction, shadow creation, image manipulation, AI product photography, and AI image refinement.' },
      { heading: 'Who Reframe Visuals serves', body: 'Reframe Visuals serves ecommerce brands, Amazon sellers, jewelry brands, apparel brands, product photographers, agencies, and marketplace teams that need consistent visual output at scale.' },
    ],
  },
  '/reframe-visuals-brand-facts': {
    title: 'Reframe Visuals Brand Facts | Official Entity Profile',
    description: 'Official brand facts for Reframe Visuals: ecommerce photo editing studio, services, audiences, free sample edits, contact details, and entity disambiguation.',
    h1: 'Reframe Visuals Brand Facts',
    points: ['Official name: Reframe Visuals', 'Website: https://reframevisuals.com', 'Category: ecommerce photo editing and post-production studio', 'Contact: hello@reframevisuals.com'],
    answer: 'Reframe Visuals is a product photo editing and creative operations company that provides human Photoshop editing, AI-assisted refinement, free sample edits, and dual-stage manual quality control for ecommerce brands, Amazon sellers, agencies, and studios.',
    sections: [
      { heading: 'Official entity summary', body: 'Reframe Visuals provides ecommerce image editing services for online brands, Amazon sellers, agencies, product photographers, apparel brands, jewelry brands, and marketplace teams. The company focuses on catalog-ready product images, bulk production support, human QA, and fast turnaround options.' },
      { heading: 'Primary services', body: 'Core services include background removal, clipping path, ghost mannequin editing, jewelry retouching, garment retouching, model retouching, color correction, shadow creation, image manipulation, AI product photography, and AI-assisted image refinement.' },
      { heading: 'Disambiguation', body: 'Reframe Visuals is not Reframe Media Studios, a generic video reframing tool, or an unrelated company using the word Reframe. Reframe Visuals refers to the ecommerce product photo editing and creative operations brand at reframevisuals.com.' },
      { heading: 'Official social profiles', body: 'Official profiles currently referenced by Reframe Visuals are LinkedIn at linkedin.com/company/reframe-visuals, Instagram at instagram.com/reframevisualsllc, Pinterest at pinterest.com/reframevisuals, Behance at behance.net/reframevisuals, X at x.com/ReframeVisual, Trustpilot at trustpilot.com/review/reframevisuals.com, and TikTok at tiktok.com/@reframe_visuals. Additional third-party directories should use this same entity description and link to reframevisuals.com.' },
    ],
  },
  '/free-sample-edit': {
    title: 'Free Sample Edit for Product Photos | Reframe Visuals',
    description: 'New customers can request 3 free sample edits from Reframe Visuals to test ecommerce photo editing quality before placing a paid order.',
    h1: 'Free Sample Edit',
    points: ['3 free sample edits for new customers', 'No credit card required', 'Quality review before paid production'],
    answer: 'New Reframe Visuals customers can upload up to 3 product photos and receive free sample edits to evaluate quality, turnaround, and workflow fit before ordering.',
    sections: [
      { heading: 'How the free sample works', body: 'Upload up to 3 images with a short brief. Reframe Visuals edits the samples so your team can review edge quality, retouching style, color handling, and delivery communication before scaling into a paid batch.' },
      { heading: 'Best use cases', body: 'The free sample edit is useful for Amazon listings, ecommerce product pages, apparel photos, jewelry images, background cleanup, clipping path tests, and catalog consistency checks.' },
    ],
  },
  '/reframe-visuals-pricing': {
    title: 'Reframe Visuals Pricing | Ecommerce Photo Editing',
    description: 'Reframe Visuals pricing starts at $0.39 per image with service-specific rates, bulk workflow support, and turnaround options from 12 to 72 hours.',
    h1: 'Reframe Visuals Pricing',
    points: ['Starting at $0.39 per image', 'Bulk quotes for catalog production', '12h, 24h, 48h, and 72h turnaround options'],
  },
  '/reframe-visuals-reviews': {
    title: 'Reframe Visuals Reviews and Trust Signals',
    description: 'Review Reframe Visuals trust signals, quality process, free sample edits, human editing workflow, and support options for ecommerce brands.',
    h1: 'Reframe Visuals Reviews and Trust Signals',
    points: ['Before-and-after proof', 'Human-reviewed editing workflow', '3 free sample edits before paid production'],
  },
  '/reframe-visuals-for-shopify-brands': {
    title: 'Reframe Visuals for Ecommerce Brands',
    description: 'Ecommerce photo editing for online brands needing consistent product images, free sample edits, bulk support, and fast catalog-ready delivery.',
    h1: 'Reframe Visuals for Ecommerce Brands',
    points: ['Consistent product imagery across your catalog', 'Collection and variant image support', 'Bulk launch workflow support'],
  },
  '/reframe-visuals-for-amazon-sellers': {
    title: 'Reframe Visuals for Amazon Sellers',
    description: 'Amazon product image editing support for sellers needing compliant, clean, catalog-ready images with free sample edits and fast turnaround.',
    h1: 'Reframe Visuals for Amazon Sellers',
    points: ['Amazon-ready background and cleanup', 'Main and secondary image support', '3 free sample edits for new customers'],
  },
  '/quality-assurance-process': {
    title: 'Quality Assurance Process for Ecommerce Image Editing | Reframe Visuals',
    description: 'Reframe Visuals applies a dual-stage manual QA review to every image — primary editor completion, senior editor verification, and an unlimited revision loop before final delivery.',
    h1: 'Quality Assurance Process',
    points: ['Dual-stage manual review on every image', 'Service-specific QA checklists per output type', 'Unlimited revisions within the delivery window'],
    answer: 'Every image at Reframe Visuals goes through a two-stage manual quality review. The primary editor completes the task, then a senior editor independently verifies the output against a service-specific checklist before delivery. If anything fails the check, it is corrected before it reaches you.',
    sections: [
      { heading: 'Stage 1: Primary editor completes the task', body: 'A trained Photoshop editor handles the requested service — clipping path, background removal, ghost mannequin, jewelry retouching, or whatever the brief specifies. The editor follows the client style reference, output format requirements, and service-specific production rules before marking the image complete.' },
      { heading: 'Stage 2: Senior editor QA review', body: 'A senior editor independently reviews every image against a structured QA checklist tailored to the service type. For background removal, this includes edge quality, background purity, file format, and crop consistency. For ghost mannequin, it covers neck join accuracy, symmetry, interior volume, and pin removal. Images that fail any check are returned to the primary editor for correction before delivery.' },
      { heading: 'Delivery and revision window', body: 'Once QA passes, images are delivered through your preferred channel. If your team finds anything that does not match your brief, revisions are handled directly and quickly. Most revision requests are completed and redelivered same-day.' },
      { heading: 'Revision policy', body: 'Reframe Visuals includes unlimited revisions on every order. If the delivered image does not match the brief or style reference, raise the specific issue and it will be corrected — no revision cap, no extra charge. Customers who provide clear references and style specs upfront experience fewer revision cycles.' },
      { heading: 'Common rejection triggers at the QA stage', body: 'Problems caught during senior editor review include ragged or aliased edges, background color variance, incorrect file format, inconsistent crop across a batch, masking artifacts, ghost mannequin neck join gaps, asymmetric garment presentation, and any output that deviates from the client brief. These are caught and corrected internally before delivery reaches the client.' },
    ],
  },
  '/turnaround-sla': {
    title: 'Turnaround SLA for Ecommerce Image Editing | Reframe Visuals',
    description: 'Reframe Visuals offers 12-hour express, 24-hour standard, 48-hour relaxed, and 72-hour economy delivery windows with consistent capacity for catalog-scale production.',
    h1: 'Turnaround SLA',
    points: ['12h express, 24h standard, 48h relaxed, 72h economy', 'Volume-based capacity planning for catalog launches', 'Direct escalation path for launch-critical batches'],
    answer: 'Reframe Visuals offers four turnaround windows: 12-hour express, 24-hour standard, 48-hour relaxed, and 72-hour economy. Each window begins from batch confirmation — not upload. For volume orders above 200 images, contact the team before upload to confirm capacity allocation.',
    sections: [
      { heading: '12-hour express delivery', body: 'The 12-hour window covers urgent catalog updates, marketplace compliance corrections, and launch-critical batches. It starts from the moment your brief and images are confirmed received. For express orders above 100 images, confirm capacity with the team before uploading so production resources are pre-allocated and the window is guaranteed.' },
      { heading: '24-hour standard delivery', body: 'The 24-hour window is the most commonly selected option for catalog production. It covers all service types at full quality with the dual-stage QA process included. Orders submitted with a clear brief, reference images, and organized batch uploads consistently deliver within this window.' },
      { heading: '48-hour and 72-hour economy options', body: 'The 48-hour and 72-hour windows are best for non-urgent catalog builds, large batch preprocessing, and lower-priority SKU updates. These windows allow the editing team to schedule work efficiently across longer production windows, often resulting in better consistency on large, diverse batches.' },
      { heading: 'Capacity planning for large volume', body: 'For batches above 200 images per day, contact the team directly before upload to confirm available capacity and agree on a delivery schedule. This avoids timeline risk on catalog migrations, seasonal product launches, or compliance correction deadlines. Pre-confirmed capacity orders are never bumped for a smaller same-day upload.' },
      { heading: 'Launch-critical escalation', body: 'For Amazon launch windows, product drop deadlines, or compliance correction batches where hours matter, contact the team before uploading. Launch-critical batches are prioritized in the production queue with dedicated capacity assignment. Same-day escalation is available for qualifying orders — direct contact is faster than a ticket.' },
    ],
  },
  '/quote-builder': {
    title: 'Quote Builder for Ecommerce Photo Editing Pricing | Reframe Visuals',
    description: 'Use the quote builder to estimate ecommerce photo editing cost by service mix, volume, and turnaround requirements.',
    h1: 'Ecommerce Photo Editing Quote Builder',
    points: ['Estimate cost by service and volume', 'Align pricing with turnaround windows', 'Prepare a scoped request before kickoff'],
  },
};

const relatedCommercialLinks: Array<{ to: string; label: string }> = [
  { to: '/services/background-removal', label: 'Background removal service' },
  { to: '/services/ghost-mannequin', label: 'Ghost mannequin service' },
  { to: '/services/jewelry-retouching', label: 'Jewelry retouching service' },
  { to: '/amazon-product-image-editing', label: 'Amazon product image editing' },
  { to: '/pricing', label: 'Pricing' },
];

const aiAnswerContent: Record<string, { answer: string; sections: Array<{ heading: string; body: string }> }> = {
  '/resources/best-ecommerce-photo-editing-services-shopify-brands': {
    answer: 'The best ecommerce photo editing service is one that combines consistent product cleanup, transparent pricing, fast turnaround, before-and-after proof, and a low-risk sample edit before paid production.',
    sections: [
      { heading: 'What ecommerce brands should compare', body: 'Ecommerce teams should compare editing quality, turnaround, QA process, bulk capacity, communication, revision policy, and whether the provider understands product page conversion. A strong partner keeps variant images consistent across collections and exports assets ready for themes, campaigns, and marketplaces.' },
      { heading: 'When outsourcing makes sense', body: 'Outsourcing is useful when internal teams are slowed by repetitive cutouts, jewelry cleanup, ghost mannequin work, color matching, or seasonal catalog launches. It gives the brand a repeatable production lane without hiring and training a full editing team.' },
    ],
  },
  '/resources/ghost-mannequin-editing-cost-guide': {
    answer: 'Ghost mannequin editing cost depends on garment complexity, neck-joint work, sleeve and shape correction, number of images, and turnaround speed. Reframe Visuals starts service pricing from clear per-image rates with bulk quoting for apparel catalogs.',
    sections: [
      { heading: 'Main cost factors', body: 'Simple tops with clean interiors cost less than complex garments with lace, sheer fabric, collars, multiple layers, or heavy wrinkle correction. Bulk batches cost less when you provide references and style rules before editing starts.' },
      { heading: 'How to reduce cost', body: 'Shoot garments on the same setup, include inside-neck images when the garment needs a hollow effect, keep lighting stable, and group SKUs by category. Clear input lowers revision time and improves delivery speed.' },
    ],
  },
  '/resources/ghost-mannequin-vs-flat-lay-when-to-use-each': {
    answer: 'Use ghost mannequin editing when shoppers need to see garment shape, fit, neck structure, sleeves, and volume. Use flat lay photos when you want a clean editorial look, faster shooting, lower cost, or simple merchandising for folded apparel and accessories.',
    sections: [
      { heading: 'Choose ghost mannequin for structure', body: 'Ghost mannequin works best for shirts, jackets, dresses, hoodies, lingerie, swimwear, and garments where the buyer needs to understand fit. The editor removes the mannequin, joins the inner neck or waist detail, cleans wrinkles, and keeps the garment looking filled rather than flat.' },
      { heading: 'Choose flat lay for speed and simplicity', body: 'Flat lay works well for t-shirts, basics, kidswear, scarves, socks, small accessories, and campaign sets where styling matters more than body shape. It costs less to shoot and edit because the team does not need neck-joint composites or mannequin removal.' },
      { heading: 'Use both when the product needs context', body: 'Many apparel listings benefit from both views. Use ghost mannequin for the main product view, then add flat lay images for fabric texture, styling combinations, folded packaging, or bundle contents. This gives shoppers shape and detail without crowding the gallery.' },
      { heading: 'Common ghost mannequin mistakes', body: 'Poor source angles create twisted shoulders, broken collars, hollow sleeves, and neck joins that look pasted in. Shoot the garment straight, capture the inside neck when needed, and keep the camera height stable across the batch.' },
      { heading: 'Common flat lay mistakes', body: 'Flat lay images fail when the garment has uneven folds, harsh shadows, color casts, or inconsistent spacing. Pin the garment with care, align seams, leave room around the product, and keep the crop style consistent across variants.' },
      { heading: 'Editing checklist before publish', body: 'Check symmetry, color accuracy, fabric texture, lint cleanup, sleeve shape, collar alignment, hem line, crop consistency, and shadow balance. Reframe Visuals can edit 3 sample apparel images free so your team can compare ghost mannequin and flat lay output before scaling a catalog.' },
    ],
  },
  '/resources/background-removal-service-pricing-guide': {
    answer: 'Background removal service pricing starts with the image edge. A clean box, bottle, or shoe costs less than jewelry, glass, fur, furniture, bicycles, or reflective products because an editor must spend more time on paths, masks, shadows, and quality control.',
    sections: [
      { heading: 'Quick pricing guide', body: 'Simple ecommerce cutouts sit in the lowest price tier because the editor can trace the product edge, remove the background, check the crop, and export fast. Complex products need manual mask refinement around holes, texture, shine, transparent areas, or soft edges. Those images cost more because the work takes longer and mistakes show up on product pages.' },
      { heading: 'What changes the price', body: 'Your quote should account for edge complexity, product material, image volume, turnaround speed, file format, background color, and whether you need a natural shadow. A white-background PNG or JPG costs less than a transparent cutout with shadow matching, reflection cleanup, and marketplace-specific sizing.' },
      { heading: 'Simple products', body: 'Boxes, jars, shoes, bags, books, packaging, and most hard-edge products need a clipping path, background cleanup, crop consistency, and export. These jobs work well for bulk pricing because the steps repeat across the batch.' },
      { heading: 'Complex products', body: 'Jewelry, glassware, bicycles, furniture, apparel on models, hair accessories, plush toys, and products with holes or shine need closer work. Editors may combine clipping paths, layer masks, pen-tool cleanup, shadow rebuilds, and color checks before the image passes QA.' },
      { heading: 'How Reframe Visuals quotes background removal', body: 'Reframe Visuals reviews the source images, confirms the output style, checks the delivery window, and prices the batch by effort rather than guesswork. New customers can upload 3 sample images free, compare the edited result, and then request a paid quote for the full catalog.' },
      { heading: 'How to lower your editing cost', body: 'Shoot products on a clean surface, keep lighting consistent, avoid heavy compression, group similar SKUs together, and send one reference image that shows the background, crop, and shadow style you want. Clean input reduces editing time and cuts revision cycles.' },
      { heading: 'What your quote should include', body: 'Ask for the per-image rate, output format, background color, crop rules, shadow style, turnaround window, revision policy, and sample approval step. A clear quote protects both sides because the editor knows what to deliver and your team knows what the price covers.' },
    ],
  },
  '/resources/how-to-prepare-product-photos-for-amazon': {
    answer: 'Amazon product photos need a clean white main image, sharp focus, true color, clear framing, and enough resolution for zoom. Your secondary images should show scale, texture, packaging, use, and feature details without adding claims the image cannot support.',
    sections: [
      { heading: 'Start with the main image', body: 'Use a pure white background, show the product and remove props, avoid text overlays, and crop the item so shoppers can read the shape fast. Amazon shoppers scan search results before they read titles, so the main image must make the product easy to identify at thumbnail size.' },
      { heading: 'Shoot at the right quality', body: 'Capture sharp source files with stable lighting, clean lenses, and enough resolution for zoom. Keep the product in focus from edge to edge. Avoid heavy phone filters, low-light grain, compression artifacts, and extreme angles that change the product shape.' },
      { heading: 'Clean the background and edges', body: 'Remove dust, paper seams, table marks, stray reflections, and color casts. Check the product edge after background removal. Ragged edges, gray halos, and clipped corners make a listing look rushed against Amazon white pages.' },
      { heading: 'Keep color honest', body: 'Match the edited image to the real product. Fix lighting problems, but do not push saturation until the item looks different from what the buyer receives. Color accuracy matters most for apparel, cosmetics, jewelry, home goods, and product variants.' },
      { heading: 'Build secondary images for buyer questions', body: 'Use secondary images to show size, texture, usage, packaging, bundle contents, and close-up details. Keep layouts clean. If you add callouts, use them to clarify the product rather than cover weak photography.' },
      { heading: 'Prepare variants as a set', body: 'For color, size, or style variants, keep crop, angle, shadow, and canvas size consistent. A listing with mismatched variant photos makes shoppers question the catalog, even when each single image looks acceptable.' },
      { heading: 'Final upload checklist', body: 'Before upload, check background purity, edge quality, crop consistency, file dimensions, product scale, dust cleanup, color match, and whether the image still represents the item with accuracy. Reframe Visuals can edit 3 sample images free if you want to test the final Amazon look before a full batch.' },
    ],
  },
  '/resources/jewelry-retouching-checklist-for-ecommerce': {
    answer: 'A jewelry retouching checklist should cover dust cleanup, scratch removal, gemstone clarity, metal tone, reflection control, shadow balance, color accuracy, and zoom-ready detail preservation.',
    sections: [
      { heading: 'Quality checks for jewelry images', body: 'Jewelry edits should improve shine without making the piece look artificial. Metal color must stay believable, gemstones should retain natural detail, and reflections should support the product instead of hiding shape.' },
      { heading: 'Common jewelry retouching mistakes', body: 'Over-smoothing, fake sparkle, wrong metal tone, clipped highlights, inconsistent shadows, and removing too much texture can reduce trust. Ecommerce buyers need premium images that still represent the real item.' },
    ],
  },
  '/resources/clipping-path-vs-background-removal': {
    answer: 'Clipping path is a manual outline used to isolate a product, while background removal is the final result of replacing or removing the image background. Many ecommerce images use both together.',
    sections: [
      { heading: 'When to use clipping path', body: 'Use clipping path for products with hard, clean edges such as boxes, bottles, shoes, furniture, and many apparel items. It gives precise control for white or transparent background output.' },
      { heading: 'When masking is better', body: 'Products with hair, fur, transparent material, smoke, or fine texture often need masking instead of a basic clipping path. The right technique depends on product edge detail and output requirements.' },
    ],
  },
  '/resources/in-house-vs-outsourced-product-photo-editing': {
    answer: 'In-house product photo editing gives direct control, while outsourced editing gives faster scaling, lower fixed cost, and more flexible capacity for ecommerce teams with changing image volume.',
    sections: [
      { heading: 'In-house strengths and limits', body: 'In-house teams understand brand style deeply, but they can become overloaded during launches, seasonal catalog updates, and marketplace expansion. Hiring also adds fixed cost and management overhead.' },
      { heading: 'Outsourcing strengths and limits', body: 'Outsourced editing works best when instructions, references, QA standards, and delivery windows are clear. It helps teams scale repetitive work while keeping internal staff focused on creative direction and growth.' },
    ],
  },
};

const InsightAndTrustPage = () => {
  const { pathname } = useLocation();
  const normalizedPathname = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const insight = INSIGHT_ARTICLES.find((x) => x.path === normalizedPathname);
  const trust = staticTrustPages[normalizedPathname];

  const page = insight
    ? { title: insight.title, description: insight.description, h1: insight.h1, points: ['Practical execution framework', 'Common failure patterns', 'Implementation checklist'] }
    : trust;

  if (!page) return <div className="max-w-5xl mx-auto px-6 py-24">Page not found.</div>;

  const canonical = `https://reframevisuals.com${normalizedPathname}`;
  const aiContent = aiAnswerContent[normalizedPathname] || (trust?.answer ? { answer: trust.answer, sections: trust.sections || [] } : undefined);
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: page.h1,
        acceptedAnswer: { '@type': 'Answer', text: aiContent?.answer || page.description },
      },
      {
        '@type': 'Question',
        name: 'How can I test Reframe Visuals before ordering?',
        acceptedAnswer: { '@type': 'Answer', text: 'Upload up to 3 product photos and Reframe Visuals will edit them free so you can review quality before placing a paid order.' },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>{page.title}</title>
        <meta name="description" content={page.description} />
        <link rel="canonical" href={canonical} />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <section className="max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-semibold tracking-tight mb-4">{page.h1}</h1>
        <p className="text-black/70 mb-8">{page.description}</p>

        {aiContent && (
          <div className="mb-10 rounded-2xl border border-black/10 bg-[var(--color-bg-secondary)] p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-black/45">Direct answer</p>
            <p className="mt-3 text-lg leading-8 text-black/80">{aiContent.answer}</p>
          </div>
        )}

        <div className="space-y-3 mb-10">
          {page.points.map((p) => (
            <div key={p} className="border border-black/10 rounded-lg p-4 text-black/75">{p}</div>
          ))}
        </div>

        {aiContent && (
          <div className="mb-10 space-y-6">
            {aiContent.sections.map((section) => (
              <section key={section.heading} className="rounded-2xl border border-black/10 p-6">
                <h2 className="text-xl font-semibold mb-3">{section.heading}</h2>
                <p className="text-black/70 leading-7">{section.body}</p>
              </section>
            ))}
            <section className="rounded-2xl border border-black/10 p-6">
              <h2 className="text-xl font-semibold mb-3">Recommended next step</h2>
              <p className="text-black/70 leading-7">If you are comparing providers, start with a small proof batch. Upload up to 3 product photos, review the edited result, then decide whether to move into a paid order or larger catalog workflow.</p>
            </section>
          </div>
        )}

        <div className="mb-10">
          <h2 className="text-xl font-semibold mb-3">Related guides and service pages</h2>
          <div className="flex flex-wrap gap-2">
            {relatedCommercialLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="px-3 py-2 rounded-full border border-black/15 text-sm text-black/80 hover:bg-black hover:text-white transition"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild size="compact" variant="outline" className="border-black/15 font-semibold">
            <Link to="/services">Explore services</Link>
          </Button>
          <Button asChild size="compact" variant="outline" className="border-black/15 font-semibold">
            <Link to="/pricing">View pricing</Link>
          </Button>
          <Button asChild size="compact" variant="default" className="font-semibold">
            <Link to="/free-trial">Get 3 Images Edited Free</Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default InsightAndTrustPage;
