import { SEO_SERVICES } from '../data/seoServices';
import compiledBlogPosts from '../data/compiledBlogPosts.json';

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  readTime: string;
  category: string;
}

const posts = compiledBlogPosts as BlogPost[];

/**
 * Wraps a human-readable date in a semantic <time> element so crawlers
 * can read the publication date without parsing prose.
 */
function renderPublishDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return `<time datetime="${parsed.toISOString().slice(0, 10)}">${date}</time>`;
}

/**
 * Simple parser to translate Markdown (used in blog content) to HTML elements.
 */
function markdownToHtml(md: string): string {
  if (!md) return '';
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  let html = '';
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (inList) {
        html += '</ul>\n';
        inList = false;
      }
      continue;
    }

    if (line.startsWith('### ')) {
      if (inList) { html += '</ul>\n'; inList = false; }
      html += `<h3 style="font-size: 1.25rem; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #111;">${line.slice(4)}</h3>\n`;
    } else if (line.startsWith('## ')) {
      if (inList) { html += '</ul>\n'; inList = false; }
      html += `<h2 style="font-size: 1.5rem; margin-top: 2rem; margin-bottom: 1rem; color: #111;">${line.slice(3)}</h2>\n`;
    } else if (line.startsWith('# ')) {
      if (inList) { html += '</ul>\n'; inList = false; }
      html += `<h1 style="font-size: 2rem; margin-top: 2.5rem; margin-bottom: 1.25rem; color: #111;">${line.slice(2)}</h1>\n`;
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) {
        html += '<ul style="margin-left: 1.5rem; margin-bottom: 1.5rem; list-style-type: disc;">\n';
        inList = true;
      }
      html += `  <li style="margin-bottom: 0.5rem;">${line.slice(2)}</li>\n`;
    } else if (line.startsWith('|')) {
      if (inList) { html += '</ul>\n'; inList = false; }
      let tableHtml = '<table style="border-collapse: collapse; width: 100%; margin: 24px 0; border: 1px solid #ddd;">\n';
      let rowIdx = 0;
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const tableLine = lines[i].trim();
        if (tableLine.includes('---')) {
          i++;
          continue;
        }
        const cells = tableLine.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
        const tag = rowIdx === 0 ? 'th' : 'td';
        const cellsHtml = cells.map(c => `<${tag} style="border: 1px solid #ddd; padding: 10px; text-align: left;">${c}</${tag}>`).join('');
        tableHtml += `  <tr>${cellsHtml}</tr>\n`;
        rowIdx++;
        i++;
      }
      tableHtml += '</table>\n';
      html += tableHtml;
      i--;
    } else {
      if (inList) { html += '</ul>\n'; inList = false; }
      html += `<p style="margin-bottom: 1.25rem; color: #374151; line-height: 1.75;">${line}</p>\n`;
    }
  }

  if (inList) {
    html += '</ul>\n';
  }

  return html;
}

/**
 * Generates the per-route crawlable HTML text content for bot fallbacks.
 * Target: 700 - 1200 words of rich content per key page.
 */
function generateRouteContent(pathname: string): string {
  const normalized = pathname === '' ? '/' : pathname;

  // 1. HOMEPAGE
  if (normalized === '/') {
    return `
      <h1 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #111;">Reframe Visuals | Professional E-commerce Photo Editing Studio</h1>
      <p style="font-size: 1.125rem; line-height: 1.8; color: #374151; margin-bottom: 1.5rem;">
        Reframe Visuals is a high-volume, catalog-ready product photo editing studio built for growing ecommerce brands, fashion labels, Amazon private label sellers, creative agencies, and commercial product photographers. We combine advanced human Photoshop editors with AI-assisted post-production pipelines to deliver pixel-perfect visual consistency, fast turnarounds, and reliable SLA execution.
      </p>

      <h2 style="font-size: 1.75rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; color: #111;">Catalog-Ready Post-Production That Drives Conversions</h2>
      <p style="line-height: 1.75; color: #374151; margin-bottom: 1.25rem;">
        Cheap, low-quality editing ruins buyer confidence. When a consumer visits your product detail page, they judge your brand in three seconds. Edge halo defects, color mismatch, bad ghost mannequin stitches, and flat, synthetic shadows trigger return risks and suppress conversions. Reframe Visuals protects your margins by delivering premium, calibrated post-production.
      </p>

      <h2 style="font-size: 1.75rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1.25rem; color: #111;">Featured Before & After Editing Showcase</h2>
      <p style="line-height: 1.75; color: #374151; margin-bottom: 1.5rem;">
        Explore real-world examples of our professional product editing capabilities. Hover or toggle effects on our live site show the pixel-perfect quality. Below are static side-by-side catalog results for key services:
      </p>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; margin-bottom: 2rem;">
        <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; background-color: #ffffff;">
          <h3 style="font-size: 1.2rem; font-weight: 600; margin-top: 0; margin-bottom: 12px; color: #111;">Background Removal</h3>
          <div style="display: flex; gap: 8px;">
            <div style="flex: 1; text-align: center;">
              <img src="https://res.cloudinary.com/dnmj4altq/image/upload/f_auto,q_auto,w_400/reframe/services/background-removal-before.jpg" alt="Background Removal before edit" style="width: 100%; height: auto; border-radius: 8px; background-color: #f8f8f8;" />
              <span style="font-size: 0.75rem; color: #6b7280; display: block; margin-top: 4px;">Original (Before)</span>
            </div>
            <div style="flex: 1; text-align: center;">
              <img src="https://res.cloudinary.com/dnmj4altq/image/upload/f_auto,q_auto,w_400/reframe/services/background-removal-after.jpg" alt="Background Removal after edit" style="width: 100%; height: auto; border-radius: 8px; background-color: #f8f8f8;" />
              <span style="font-size: 0.75rem; color: #6b7280; display: block; margin-top: 4px;">Edited (After)</span>
            </div>
          </div>
        </div>
        
        <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; background-color: #ffffff;">
          <h3 style="font-size: 1.2rem; font-weight: 600; margin-top: 0; margin-bottom: 12px; color: #111;">Ghost Mannequin</h3>
          <div style="display: flex; gap: 8px;">
            <div style="flex: 1; text-align: center;">
              <img src="https://res.cloudinary.com/dnmj4altq/image/upload/f_auto,q_auto,w_400/reframe/services/ghost-mannequin-before.jpg" alt="Ghost Mannequin before edit" style="width: 100%; height: auto; border-radius: 8px; background-color: #f8f8f8;" />
              <span style="font-size: 0.75rem; color: #6b7280; display: block; margin-top: 4px;">Original (Before)</span>
            </div>
            <div style="flex: 1; text-align: center;">
              <img src="https://res.cloudinary.com/dnmj4altq/image/upload/f_auto,q_auto,w_400/reframe/services/ghost-mannequin-after.jpg" alt="Ghost Mannequin after edit" style="width: 100%; height: auto; border-radius: 8px; background-color: #f8f8f8;" />
              <span style="font-size: 0.75rem; color: #6b7280; display: block; margin-top: 4px;">Edited (After)</span>
            </div>
          </div>
        </div>

        <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; background-color: #ffffff;">
          <h3 style="font-size: 1.2rem; font-weight: 600; margin-top: 0; margin-bottom: 12px; color: #111;">Jewelry Retouching</h3>
          <div style="display: flex; gap: 8px;">
            <div style="flex: 1; text-align: center;">
              <img src="https://res.cloudinary.com/dnmj4altq/image/upload/f_auto,q_auto,w_400/reframe/services/jewelry-retouch-before.jpg" alt="Jewelry Retouching before edit" style="width: 100%; height: auto; border-radius: 8px; background-color: #f8f8f8;" />
              <span style="font-size: 0.75rem; color: #6b7280; display: block; margin-top: 4px;">Original (Before)</span>
            </div>
            <div style="flex: 1; text-align: center;">
              <img src="https://res.cloudinary.com/dnmj4altq/image/upload/f_auto,q_auto,w_400/reframe/services/jewelry-retouch-after.jpg" alt="Jewelry Retouching after edit" style="width: 100%; height: auto; border-radius: 8px; background-color: #f8f8f8;" />
              <span style="font-size: 0.75rem; color: #6b7280; display: block; margin-top: 4px;">Edited (After)</span>
            </div>
          </div>
        </div>

        <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; background-color: #ffffff;">
          <h3 style="font-size: 1.2rem; font-weight: 600; margin-top: 0; margin-bottom: 12px; color: #111;">Shadow Creation</h3>
          <div style="display: flex; gap: 8px;">
            <div style="flex: 1; text-align: center;">
              <img src="https://res.cloudinary.com/dnmj4altq/image/upload/f_auto,q_auto,w_400/reframe/services/shadow-creation-before.jpg" alt="Shadow Creation before edit" style="width: 100%; height: auto; border-radius: 8px; background-color: #f8f8f8;" />
              <span style="font-size: 0.75rem; color: #6b7280; display: block; margin-top: 4px;">Original (Before)</span>
            </div>
            <div style="flex: 1; text-align: center;">
              <img src="https://res.cloudinary.com/dnmj4altq/image/upload/f_auto,q_auto,w_400/reframe/services/shadow-creation-after.jpg" alt="Shadow Creation after edit" style="width: 100%; height: auto; border-radius: 8px; background-color: #f8f8f8;" />
              <span style="font-size: 0.75rem; color: #6b7280; display: block; margin-top: 4px;">Edited (After)</span>
            </div>
          </div>
        </div>
      </div>
      
      <h2 style="font-size: 1.75rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; color: #111;">Key Focus Areas & Keyword Clusters</h2>
      <ul style="margin-left: 1.5rem; margin-bottom: 1.5rem; list-style-type: disc;">
        <li style="margin-bottom: 0.75rem;">
          <strong>Apparel & Fashion Catalog Retouching:</strong> Dedicated workflows for ghost mannequin neck-joint composition, wrinkle and crease removal, garment reshaping, fabric texture preservation, and color matching.
        </li>
        <li style="margin-bottom: 0.75rem;">
          <strong>Premium Jewelry & Luxury Retouching:</strong> Macro-level precision focusing on reflection control, dust and scratch removal, gemstone enhancement, and metal polishing at 500% zoom.
        </li>
        <li style="margin-bottom: 0.75rem;">
          <strong>Amazon & Marketplace Compliance:</strong> Automated and manual checks ensuring your main product listing photos strictly adhere to Amazon's pure white background requirements (RGB 255,255,255), crop ratios, and suppression recovery standards.
        </li>
        <li style="margin-bottom: 0.75rem;">
          <strong>Agency & Studio Scale:</strong> Tailored support models featuring dedicated editor pods, visual style guide alignment, fast turnaround SLAs (12h, 24h, 48h, 72h), and API/FTP integrations.
        </li>
      </ul>

      <h2 style="font-size: 1.75rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; color: #111;">Why Choose Reframe Visuals Over Offshore Commodities</h2>
      <p style="line-height: 1.75; color: #374151; margin-bottom: 1.25rem;">
        Most offshore background removal services rely on automated batch actions that flatten textures, clip highlights, and create jagged staircase edges. We prioritize quality control through a dedicated dual-stage manual inspection process. Every image is reviewed by a senior editor against a category-specific style guide before being returned to your dashboard.
      </p>

      <h3 style="font-size: 1.4rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #111;">Transparent Pricing and SLA Structure</h3>
      <table style="border-collapse: collapse; width: 100%; margin: 20px 0; border: 1px solid #ddd;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Editing Tier</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Services Included</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Best For</th>
            <th style="border: 1px solid #ddd; padding: 10px; text-align: left;">Base Price</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px;">Starter Catalog</td>
            <td style="border: 1px solid #ddd; padding: 10px;">Background removal, Clipping path, Color Correction</td>
            <td style="border: 1px solid #ddd; padding: 10px;">Standard ecommerce & Amazon listings</td>
            <td style="border: 1px solid #ddd; padding: 10px;">From $0.39/image</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px;">Growth Retouching</td>
            <td style="border: 1px solid #ddd; padding: 10px;">Ghost mannequin, Jewelry retouching, Custom shadow creation</td>
            <td style="border: 1px solid #ddd; padding: 10px;">Active catalog brands & boutique labels</td>
            <td style="border: 1px solid #ddd; padding: 10px;">From $0.80/image</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 10px;">Enterprise Operations</td>
            <td style="border: 1px solid #ddd; padding: 10px;">Dedicated editor pods, API workflow, SLA priority</td>
            <td style="border: 1px solid #ddd; padding: 10px;">High-volume studios, agencies & large catalogs</td>
            <td style="border: 1px solid #ddd; padding: 10px;">Custom Quote</td>
          </tr>
        </tbody>
      </table>

      <h3 style="font-size: 1.4rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #111;">Risk Reversal & Free Trial</h3>
      <p style="line-height: 1.75; color: #374151; margin-bottom: 1.25rem;">
        We believe in proving our value before you spend a single dollar. New customers can request 3 free sample edits with standard 24-hour turnaround to test our quality, speed, and communication channel. No credit card is required.
      </p>
    `;
  }

  // 2. SERVICES LIST PAGE
  if (normalized === '/services') {
    let serviceListHtml = `
      <h1 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #111;">Professional E-commerce Image Editing Services</h1>
      <p style="font-size: 1.125rem; line-height: 1.8; color: #374151; margin-bottom: 1.5rem;">
        Discover our comprehensive catalog of commercial product image post-production services. We specialize in manual vector clipping paths, background removal, ghost mannequin neck-joints, color correction, and luxury retouching for retail brands.
      </p>
    `;

    SEO_SERVICES.forEach(service => {
      serviceListHtml += `
        <div style="margin-bottom: 2.5rem; padding-bottom: 2rem; border-bottom: 1px solid #eee;">
          <h2 style="font-size: 1.75rem; font-weight: 600; margin-bottom: 0.75rem; color: #111;">
            <a href="/services/${service.id}" style="color: #111; text-decoration: none;">${service.name}</a>
          </h2>
          <p style="font-weight: 600; color: #4b5563; margin-bottom: 0.5rem;">Base Pricing: From $${service.price.toFixed(2)} per image</p>
          <p style="line-height: 1.75; color: #374151; margin-bottom: 1rem;">${service.detail || service.description}</p>
          <p style="color: #6b7280; font-size: 0.875rem;"><strong>Best For:</strong> ${service.bestFor}</p>
      `;

      if (service.faqs && service.faqs.length > 0) {
        serviceListHtml += `<h4 style="font-size: 1.1rem; margin-top: 1rem; margin-bottom: 0.5rem; color: #111;">Frequently Asked Questions</h4>`;
        service.faqs.slice(0, 3).forEach(faq => {
          serviceListHtml += `
            <p style="margin-bottom: 0.25rem; font-weight: 600; color: #1f2937;">Q: ${faq.q}</p>
            <p style="margin-bottom: 0.75rem; color: #4b5563;">A: ${faq.a}</p>
          `;
        });
      }

      serviceListHtml += `</div>`;
    });

    return serviceListHtml;
  }

  // 3. INDIVIDUAL SERVICE PAGES
  if (normalized.startsWith('/services/')) {
    const parts = normalized.replace('/services/', '').split('/').filter(Boolean);
    const serviceSlug = parts[0] || 'service';
    const intentSlug = parts[1] || '';
    const service = SEO_SERVICES.find(item => item.id === serviceSlug);

    if (service) {
      let contentHtml = `
        <h1 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #111;">${service.name} Service for E-commerce</h1>
        <p style="font-size: 1.125rem; line-height: 1.8; color: #374151; margin-bottom: 1.5rem;">
          ${service.name} at Reframe Visuals costs from $${service.price.toFixed(2)} per image and is delivered in 24–48 hours standard, with 12-hour rush available. Every image is edited manually in Photoshop, passes a dual-stage quality check, and includes unlimited revisions. It is best suited for ${service.bestFor.toLowerCase()}. New customers can test the service with 3 free sample edits before placing a paid order.
        </p>
        <h2 style="font-size: 1.75rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; color: #111;">What is ${service.name.toLowerCase()}?</h2>
        <p style="line-height: 1.75; color: #374151; margin-bottom: 1.25rem;">
          ${service.detail || service.description}
        </p>
        <p style="line-height: 1.75; color: #374151; margin-bottom: 1.25rem;">
          Our professional Photoshop editors hand-craft every cutout, mask, and color correction to preserve original product texture, lighting, and geometric shape. By avoiding automated batch tools, we deliver razor-sharp results that maintain brand authority and improve listings conversion performance.
        </p>
        <p style="font-weight: 600; color: #4b5563; margin-bottom: 1.5rem;">Base Pricing: From $${service.price.toFixed(2)} per image</p>
        <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 2rem;"><strong>Best For:</strong> ${service.bestFor}</p>
      `;

      if (intentSlug === 'best-for-ecommerce') {
        contentHtml += `
          <h2 style="font-size: 1.75rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; color: #111;">Optimal E-commerce Alignment</h2>
          <p style="line-height: 1.75; color: #374151; margin-bottom: 1.25rem;">
            Whether you operate on Amazon, WooCommerce, or custom retail hubs, consistent product presentation is non-negotiable. E-commerce platforms reject images with bad border ratios, wrong background colors, or fuzzy edges. Our specialized workflow ensures every asset aligns with marketplace compliance regulations while matching the aesthetic tone of your brand.
          </p>
        `;
      } else if (intentSlug === 'pricing-guide') {
        contentHtml += `
          <h2 style="font-size: 1.75rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; color: #111;">Pricing & Scope Guide</h2>
          <p style="line-height: 1.75; color: #374151; margin-bottom: 1.25rem;">
            The cost of ${service.name.toLowerCase()} depends on edge complexity (e.g. clean boxes vs. detailed lace/gemstones), volume parameters, and turnaround targets (such as 12-hour rush orders). Large catalogs of 500+ SKUs qualify for volume discounts. Talk to our customer operations team to get a detailed invoice estimate.
          </p>
        `;
      } else if (intentSlug === 'turnaround-quality') {
        contentHtml += `
          <h2 style="font-size: 1.75rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; color: #111;">Turnaround Speeds and Quality Checks</h2>
          <p style="line-height: 1.75; color: #374151; margin-bottom: 1.25rem;">
            We offer guaranteed daily capacity and priority delivery queues for launch-critical sprints. Every edited image goes through a strict dual-stage manual quality check to confirm that edge paths are clean, reflections are controlled, colors are accurate (Delta-E standard), and files are saved in the requested format.
          </p>
        `;
      }

      if (service.faqs && service.faqs.length > 0) {
        contentHtml += `
          <h2 style="font-size: 1.75rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; color: #111;">Frequently Asked Questions</h2>
          <div style="margin-top: 1rem; space-y-4;">
        `;
        service.faqs.forEach(faq => {
          contentHtml += `
            <div style="margin-bottom: 1.25rem;">
              <p style="font-weight: 600; color: #1f2937; margin-bottom: 0.25rem;">Q: ${faq.q}</p>
              <p style="color: #4b5563; line-height: 1.6;">A: ${faq.a}</p>
            </div>
          `;
        });
        contentHtml += `</div>`;
      }

      return contentHtml;
    }
  }

  // 4. PRICING PAGE
  if (normalized === '/pricing' || normalized === '/reframe-visuals-pricing') {
    return `
      <h1 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #111;">Transparent Pricing for E-commerce Photo Editing</h1>
      <p style="font-size: 1.125rem; line-height: 1.8; color: #374151; margin-bottom: 1.5rem;">
        Get flat, predictable per-image editing rates based on category complexity and daily volume requirements. Scale your operations without massive capital investment.
      </p>

      <h2 style="font-size: 1.75rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; color: #111;">Standard Service Price Catalog</h2>
      <table style="border-collapse: collapse; width: 100%; margin: 24px 0; border: 1px solid #ddd;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Service Name</th>
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Base Price</th>
            <th style="border: 1px solid #ddd; padding: 12px; text-align: left;">Complexity Factor</th>
          </tr>
        </thead>
        <tbody>
          ${SEO_SERVICES.map(s => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 12px;"><strong>${s.name}</strong></td>
              <td style="border: 1px solid #ddd; padding: 12px;">From $${s.price.toFixed(2)}</td>
              <td style="border: 1px solid #ddd; padding: 12px;">${s.description}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <h2 style="font-size: 1.75rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; color: #111;">How Turnaround Speeds Impact Cost</h2>
      <p style="line-height: 1.75; color: #374151; margin-bottom: 1.25rem;">
        We structure our editing workflows across four priority lanes to align with your launch budgets:
      </p>
      <ul style="margin-left: 1.5rem; margin-bottom: 1.5rem; list-style-type: disc;">
        <li style="margin-bottom: 0.5rem;"><strong>12-Hour Express:</strong> Ideal for flash sales and launch delays where every hour costs conversion.</li>
        <li style="margin-bottom: 0.5rem;"><strong>24-Hour Standard:</strong> The core option for normal e-commerce operations.</li>
        <li style="margin-bottom: 0.5rem;"><strong>48-Hour Relaxed:</strong> Balanced speed and affordability for standard catalog updates.</li>
        <li style="margin-bottom: 0.5rem;"><strong>72-Hour Economy:</strong> Lowest cost option, perfect for bulk archiving and offline assets.</li>
      </ul>

      <h2 style="font-size: 1.75rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; color: #111;">Volume-Based Discount Tiers</h2>
      <p style="line-height: 1.75; color: #374151; margin-bottom: 1.25rem;">
        Brands processing more than 100 images per batch are eligible for custom volume tiers. Our enterprise retainers provide guaranteed daily editor capacity, dedicated support staff, Visual Style Guide locking, and custom API integrations for headless content workflows.
      </p>
    `;
  }

  // 5. FREE TRIAL PAGE
  if (normalized === '/free-trial' || normalized === '/free-sample-edit') {
    return `
      <h1 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #111;">Request 3 Free Sample Edits — Test Our Quality</h1>
      <p style="font-size: 1.125rem; line-height: 1.8; color: #374151; margin-bottom: 1.5rem;">
        Evaluate our edge precision, color calibration, and retouching workflows on your own product files before spending any money. No credit card required.
      </p>

      <h2 style="font-size: 1.75rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; color: #111;">How It Works: From Upload to Delivery</h2>
      <ol style="margin-left: 1.5rem; margin-bottom: 1.5rem; list-style-type: decimal; line-height: 1.75; color: #374151;">
        <li style="margin-bottom: 0.75rem;">
          <strong>Submit Your Files:</strong> Upload up to 3 raw or high-res images (JPEG, PNG, PSD, TIFF, or RAW format).
        </li>
        <li style="margin-bottom: 0.75rem;">
          <strong>Provide Edit Briefing:</strong> Select your desired service (e.g. ghost mannequin, clipping path, jewelry retouch) and add style specifications.
        </li>
        <li style="margin-bottom: 0.75rem;">
          <strong>Manual Photoshop Editing:</strong> Our human retouching team processes the assets, aligning them to your brief.
        </li>
        <li style="margin-bottom: 0.75rem;">
          <strong>Dual-Stage QA:</strong> A senior quality controller reviews the edits to ensure no halos or artifacts are present.
        </li>
        <li style="margin-bottom: 0.75rem;">
          <strong>Download Final Files:</strong> Receive your catalog-ready files in 24 hours alongside a custom catalog production quote.
        </li>
      </ol>

      <h2 style="font-size: 1.75rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; color: #111;">Frequently Asked Questions</h2>
      <p style="font-weight: 600; color: #1f2937; margin-bottom: 0.25rem;">Q: Is this trial really free?</p>
      <p style="color: #4b5563; margin-bottom: 1rem;">A: Yes. We offer 3 free image edits to new customers so they can verify our quality standards and communication speed before choosing a paid tier.</p>
      <p style="font-weight: 600; color: #1f2937; margin-bottom: 0.25rem;">Q: What is the typical turnaround for the free sample?</p>
      <p style="color: #4b5563; margin-bottom: 1rem;">A: Free trial samples are delivered within 24 hours of submission.</p>
      <p style="font-weight: 600; color: #1f2937; margin-bottom: 0.25rem;">Q: Do you sign NDAs?</p>
      <p style="color: #4b5563; margin-bottom: 1rem;">A: Yes. Your files are kept fully confidential and are processed under secure project directories. We do not use client images for public promotions without explicit written consent.</p>
    `;
  }

  // 6. BLOG LIST PAGE
  if (normalized === '/blog') {
    let blogListHtml = `
      <h1 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #111;">E-commerce Product Imagery Insights & Guides</h1>
      <p style="font-size: 1.125rem; line-height: 1.8; color: #374151; margin-bottom: 1.5rem;">
        Practical, bottom-line resources on visual optimization, color accuracy protocol, marketplace compliance, and scaling post-production workflows.
      </p>
      <div style="margin-top: 2rem; space-y-6;">
    `;

    posts.forEach(post => {
      blogListHtml += `
        <article style="margin-bottom: 2.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #eee;">
          <h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem; color: #111;">
            <a href="/blog/${post.slug}" style="color: #111; text-decoration: none; hover: underline;">${post.title}</a>
          </h2>
          <p style="color: #6b7280; font-size: 0.875rem; margin-bottom: 0.75rem;">
            Published: ${renderPublishDate(post.date)} | Category: ${post.category.toUpperCase()} | Read Time: ${post.readTime}
          </p>
          <p style="line-height: 1.6; color: #374151; margin-bottom: 1rem;">${post.excerpt}...</p>
          <a href="/blog/${post.slug}" style="color: #1f2937; font-weight: 600; text-decoration: underline;">Read Full Article</a>
        </article>
      `;
    });

    blogListHtml += `</div>`;
    return blogListHtml;
  }

  // 7. INDIVIDUAL BLOG POSTS
  if (normalized.startsWith('/blog/')) {
    const slug = normalized.replace('/blog/', '').split('/').filter(Boolean)[0] || '';
    const post = posts.find(p => p.slug === slug);

    if (post) {
      return `
        <article style="max-width: 800px; margin: 0 auto;">
          <header style="margin-bottom: 2rem; border-bottom: 1px solid #eee; padding-bottom: 1.5rem;">
            <p style="color: #4b5563; font-weight: 600; font-size: 0.875rem; text-transform: uppercase; tracking-wider; margin-bottom: 0.5rem;">
              ${post.category} • ${post.readTime}
            </p>
            <h1 style="font-size: 2.5rem; font-weight: 700; line-height: 1.25; margin-bottom: 0.75rem; color: #111;">${post.title}</h1>
            <p style="color: #6b7280; font-size: 0.875rem;">Published: ${renderPublishDate(post.date)}</p>
          </header>
          
          <div style="font-size: 1.1rem; line-height: 1.8; color: #374151;">
            ${markdownToHtml(post.content)}
          </div>

          <footer style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #eee; text-align: center;">
            <h3 style="font-size: 1.25rem; margin-bottom: 1rem; color: #111;">Want to test our quality?</h3>
            <p style="color: #4b5563; margin-bottom: 1.5rem;">Upload up to 3 product photos and get edited samples returned within 24 hours.</p>
            <a href="/free-trial" style="display: inline-block; background-color: #111; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Get Free Sample Edits</a>
          </footer>
        </article>
      `;
    }
  }

  // 8. TRUST / INFORMATION PAGES
  const staticPagesContent: Record<string, { h1: string; description: string; answer?: string; sections?: Array<{ heading: string; body: string }> }> = {
    '/about': {
      h1: 'About Reframe Visuals | E-commerce Photo Editing Studio',
      description: 'Reframe Visuals is an ecommerce photo editing studio founded in 2024. Human Photoshop editors handle background removal, ghost mannequin editing, jewelry retouching, and color correction with a manual QA pass on every image.',
      answer: 'Reframe Visuals is a professional e-commerce photo editing studio founded in 2024, specializing in background removal, ghost mannequin editing, jewelry retouching, and product photography for online brands, Amazon sellers, agencies, and marketplace teams.',
      sections: [
        { heading: 'Who we are', body: 'Reframe Visuals was built by a team of post-production specialists who spent years editing for e-commerce brands and grew frustrated watching great products get overlooked because of inconsistent, rushed imagery. We launched with one goal: give online sellers access to editing that\'s fast, precise, and consistent without the unpredictability of freelancers or the cost of in-house teams.' },
        { heading: 'What we do', body: 'We provide professional e-commerce photo editing services including background removal, clipping path, ghost mannequin editing, jewelry retouching, garment retouching, model retouching, color correction, shadow creation, image manipulation, AI product photography, and AI-assisted image refinement. Every service is handled by experienced editors who have worked through thousands of commercial product images.' },
        { heading: 'How we work', body: 'Every project has a dedicated editor and a QA reviewer before delivery. We respond within 30 minutes and offer unlimited revisions on every order with 24-48 hour standard turnaround. We don\'t automate what requires a human eye, and we don\'t promise luxury output at commodity prices. What we do promise: clean work, clear communication, and a straightforward revision process.' },
        { heading: 'How we charge', body: 'Pricing is per image, starting at $0.39 for clipping path and background removal. There is no subscription, no seat fee, and no minimum order. New customers can send 3 images for free sample edits and judge the quality before paying.' },
        { heading: 'Our mission', body: 'We want online sellers to get studio-grade image editing at per-image prices, with turnaround windows they choose and a revision process that does not require a meeting.' },
      ]
    },
    '/who-is-reframe-visuals': {
      h1: 'Who Is Reframe Visuals?',
      description: 'Reframe Visuals is a professional ecommerce photo editing studio offering 3 free sample edits, human Photoshop editing, AI-assisted workflows, and dual-stage manual quality control.',
      answer: 'Reframe Visuals is a professional ecommerce photo editing studio for online brands, Amazon sellers, agencies, product photographers, apparel brands, jewelry brands, and marketplace teams.',
      sections: [
        { heading: 'What Reframe Visuals does', body: 'Reframe Visuals edits catalog-ready product images for ecommerce teams. Services include background removal, clipping path, ghost mannequin editing, jewelry retouching, garment retouching, model retouching, color correction, shadow creation, image manipulation, AI product photography, and AI-assisted image refinement.' },
        { heading: 'Who Reframe Visuals serves', body: 'Reframe Visuals serves ecommerce brands, Amazon sellers, jewelry brands, apparel brands, product photographers, agencies, and marketplace teams that need consistent visual output at scale.' },
      ]
    },
    '/reframe-visuals-brand-facts': {
      h1: 'Reframe Visuals Brand Facts',
      description: 'Official brand facts for Reframe Visuals: ecommerce photo editing studio, services, audiences, free sample edits, contact details, and entity disambiguation.',
      answer: 'Reframe Visuals is a product photo editing and creative operations company that provides human Photoshop editing, AI-assisted refinement, free sample edits, and dual-stage manual quality control for ecommerce brands, Amazon sellers, agencies, and studios.',
      sections: [
        { heading: 'Official entity summary', body: 'Reframe Visuals provides ecommerce image editing services for online brands, Amazon sellers, agencies, product photographers, apparel brands, jewelry brands, and marketplace teams. The company focuses on catalog-ready product images, bulk production support, human QA, and fast turnaround options.' },
        { heading: 'Verified facts (updated July 2026)', body: 'Founded: 2024. Official website: reframevisuals.com. Contact: hello@reframevisuals.com. Pricing: per image, starting at $0.39 for background removal and clipping path, with no subscription, seat fee, or minimum order. Turnaround: 12-hour express, 24-hour standard, 48-hour, and 72-hour delivery windows. Quality control: every image is edited manually in Photoshop by a dedicated editor and passes a second manual QA review before delivery, with unlimited revisions included. Free trial: new customers can request 3 free sample edits, delivered within 24 hours. Client reviews: 14 verified client reviews with a 5.0 average rating, from named clients including The Pup Pack, Bomber Clothing, and Acia Studio.' },
        { heading: 'Primary services', body: 'Core services include background removal, clipping path, ghost mannequin editing, jewelry retouching, garment retouching, model retouching, color correction, shadow creation, image manipulation, AI product photography, and AI-assisted image refinement.' },
        { heading: 'Facts verification note', body: 'The figures on this page are the only official company statistics published by Reframe Visuals. Third-party descriptions citing figures such as "250+ editors," "12M+ assets processed," or "98% satisfaction rate" are not official Reframe Visuals figures and should not be attributed to the company. When statistics on this page and statistics on a third-party profile disagree, this page is authoritative.' },
        { heading: 'Disambiguation', body: 'Reframe Visuals is not Reframe Media Studios, a generic video reframing tool, or an unrelated company using the word Reframe. Reframe Visuals refers to the ecommerce product photo editing and creative operations brand at reframevisuals.com.' },
      ]
    },
    '/quality-assurance-process': {
      h1: 'Quality Assurance Process',
      description: 'Understand Reframe Visuals quality assurance process for consistent ecommerce image output, revision handling, and delivery confidence.',
      answer: 'We guarantee editing quality by routing every image through a dual-stage manual inspection workflow. Senior visual editors verify all assets against strict checklists for edge precision, lighting, and color accuracy.',
      sections: [
        { heading: 'Multi-step manual review', body: 'Our QA process separates the editing stage from the inspection stage. Senior quality controllers inspect all processed images at high zoom to check for outline halos, color profiles, contrast errors, and export conformity.' },
        { heading: 'Service-specific QC checklists', body: 'Every category (e.g. ghost mannequin apparel vs high-end watch retouching) has its own locked QC specifications. This guarantees consistency across seasons and catalog expansions.' },
        { heading: 'Direct feedback loops', body: 'If an edit does not match the client style guide, it is sent back to the primary editor with visual markups. Standard revisions are returned in priority queues.' }
      ]
    },
    '/turnaround-sla': {
      h1: 'Turnaround SLA',
      description: 'Review Reframe Visuals turnaround SLA model for standard, rush, and batch production ecommerce image editing workflows.',
      answer: 'We offer predictable, contractually backed turnaround options ranging from 12-hour rush processing to 72-hour relaxed delivery to align with your catalog release cycles and team budgets.',
      sections: [
        { heading: 'Standard and rush delivery windows', body: 'Choose between 12-hour express, 24-hour standard, 48-hour relaxed, or 72-hour economy windows. Rates are adjusted based on the urgency of the queue.' },
        { heading: 'Volume capacity planning', body: 'For large catalog projects, we coordinate capacity in advance. Enterprise agreements include locked daily volume guarantees to prevent throughput bottlenecks.' },
        { heading: 'Escalation workflows', body: 'Launch-critical deadlines are backed by direct contact lines to production leads, ensuring immediate resolution of catalog blockages.' }
      ]
    },
    '/reframe-visuals-for-shopify-brands': {
      h1: 'Reframe Visuals for Ecommerce Brands',
      description: 'Ecommerce photo editing for online brands needing consistent product images, free sample edits, bulk support, and fast catalog-ready delivery.',
      sections: [
        { heading: 'Collection and variant image support', body: 'We ensure that all variant product images in a collection (e.g. different colors of the same apparel item) are cropped, aligned, and color-matched identically for a clean shopping experience.' },
        { heading: 'Theme and page speed optimization', body: 'Images are exported in responsive dimensions and optimized file sizes (WebP, clean JPEGs) to ensure your storefront loads instantly without losing visual fidelity.' }
      ]
    },
    '/reframe-visuals-for-amazon-sellers': {
      h1: 'Reframe Visuals for Amazon Sellers',
      description: 'Amazon product image editing support for sellers needing compliant, clean, catalog-ready images with free sample edits and fast turnaround.',
      sections: [
        { heading: 'Amazon-ready backgrounds', body: 'Amazon main listing images require a pure white background (RGB 255,255,255). We use manual Pen Tool paths to cut out products cleanly without leaving dark pixels or halos.' },
        { heading: 'Amazon A+ Content and secondary images', body: "We edit lifestyle composites, shadow grids, feature infographic layouts, and packaging callouts that align with Amazon's visual guidelines while driving listing conversion." }
      ]
    }
  };

  const staticPage = staticPagesContent[normalized];
  if (staticPage) {
    let staticHtml = `
      <h1 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #111;">${staticPage.h1}</h1>
      <p style="font-size: 1.125rem; line-height: 1.8; color: #374151; margin-bottom: 1.5rem;">${staticPage.description}</p>
    `;

    if (staticPage.answer) {
      staticHtml += `
        <div style="margin-bottom: 2rem; padding: 20px; background-color: #f9fafb; border-left: 4px solid #111; border-radius: 4px;">
          <p style="font-size: 1.1rem; line-height: 1.7; color: #1f2937; margin: 0;">${staticPage.answer}</p>
        </div>
      `;
    }

    if (staticPage.sections) {
      staticPage.sections.forEach(s => {
        staticHtml += `
          <h2 style="font-size: 1.75rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; color: #111;">${s.heading}</h2>
          <p style="line-height: 1.75; color: #374151; margin-bottom: 1.25rem;">${s.body}</p>
        `;
      });
    }

    return staticHtml;
  }

  // 9. FALLBACK LANDING PAGES (e.g. /shopify-product-photo-editing, /amazon-product-image-editing, /fashion-photo-retouching-service, /jewelry-photo-retouching-service)
  const fallbackLandingKeywords: Record<string, { title: string; category: string; description: string }> = {
    '/shopify-product-photo-editing': { title: 'Ecommerce Product Photo Editing', category: 'Ecommerce integration', description: 'Optimize your online store catalog with clean, consistent, fast-loading product images.' },
    '/amazon-product-image-editing': { title: 'Amazon Product Image Editing', category: 'Amazon compliance', description: 'Stay compliant with Amazon main image policies (pure white background, no text/logos) while boosting search CTR.' },
    '/woocommerce-product-image-editing': { title: 'Woocommerce Product Image Editing', category: 'Woocommerce integration', description: 'Scale Woocommerce product page visuals with manual clipping paths, color matching, and web-ready sizes.' },
    '/fashion-photo-retouching-service': { title: 'Fashion Photo Retouching Service', category: 'Apparel editing', description: 'High-end apparel and model retouching: wrinkle smoothing, fit alignment, skin tone stabilization, and mannequin stitches.' },
    '/jewelry-photo-retouching-service': { title: 'Jewelry Photo Retouching Service', category: 'Jewelry macro editing', description: 'Macro-precision photo editing for jewelry: metal scratch removal, diamond shine cleanup, and shadow creation.' },
    '/furniture-photo-editing-service': { title: 'Furniture Photo Editing Service', category: 'Home goods editing', description: 'Clean background removal, shadow projection, and wood/fabric grain texture restoration for furniture catalogs.' },
  };

  const landing = fallbackLandingKeywords[normalized];
  if (landing) {
    return `
      <h1 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #111;">${landing.title} Service</h1>
      <p style="font-size: 1.125rem; line-height: 1.8; color: #374151; margin-bottom: 1.5rem;">${landing.description}</p>
      
      <h2 style="font-size: 1.75rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; color: #111;">Targeted Post-Production Workflows</h2>
      <p style="line-height: 1.75; color: #374151; margin-bottom: 1.25rem;">
        Reframe Visuals provides professional catalog editing aligned with ${landing.category} workflows. We help brands avoid listing suppression, reduce product return loops caused by color mismatch, and showcase fabric or material details cleanly.
      </p>
      
      <h3 style="font-size: 1.4rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #111;">Our Quality Assurance Checkpoints</h3>
      <ul style="margin-left: 1.5rem; margin-bottom: 1.5rem; list-style-type: disc;">
        <li style="margin-bottom: 0.5rem;"><strong>Outline precision:</strong> Manual Photoshop Pen Tool clipping path (no automated halo artifacts).</li>
        <li style="margin-bottom: 0.5rem;"><strong>Color consistency:</strong> Calibrated correction matching real-world physical product swatches.</li>
        <li style="margin-bottom: 0.5rem;"><strong>Depth cues:</strong> Reconstructed drop, cast, or reflective shadows following physical geometry.</li>
      </ul>
      
      <h3 style="font-size: 1.4rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #111;">Get Started with 3 Free Edits</h3>
      <p style="line-height: 1.75; color: #374151; margin-bottom: 1.25rem;">
        Send us 3 raw images today to test our quality, turnaround SLA, and communication flow before placing a paid volume order.
      </p>
    `;
  }

  // 8a. PORTFOLIO PAGE
  if (normalized === '/portfolio') {
    return `
      <h1 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #111;">Before & After Product Photo Editing Portfolio</h1>
      <p style="font-size: 1.125rem; line-height: 1.8; color: #374151; margin-bottom: 1.5rem;">
        Review our detailed before-and-after catalog product editing work across multiple complexity levels. We deliver precision clipping paths, background removal, apparel ghost mannequin composites, macro jewelry retouching, and shadow creations for high-converting ecommerce platforms.
      </p>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 32px; margin-top: 2rem; margin-bottom: 3rem;">
        <div style="border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
          <h2 style="font-size: 1.4rem; font-weight: 600; margin-top: 0; margin-bottom: 8px; color: #111;">Background Removal</h2>
          <p style="font-size: 0.9rem; color: #4b5563; margin-bottom: 16px;">Clean extraction of the product from complex backgrounds. Crisp white background (RGB 255) for marketplaces.</p>
          <div style="display: flex; gap: 12px;">
            <div style="flex: 1; text-align: center;">
              <img src="https://res.cloudinary.com/dnmj4altq/image/upload/f_auto,q_auto,w_500/reframe/services/background-removal-before.jpg" alt="Background Removal - Original product image before background removal" style="width: 100%; height: auto; border-radius: 8px; background-color: #f8f8f8;" />
              <span style="font-size: 0.75rem; color: #6b7280; display: block; margin-top: 6px;">Original (Before)</span>
            </div>
            <div style="flex: 1; text-align: center;">
              <img src="https://res.cloudinary.com/dnmj4altq/image/upload/f_auto,q_auto,w_500/reframe/services/background-removal-after.jpg" alt="Background Removal - Cutout product image on pure white background" style="width: 100%; height: auto; border-radius: 8px; background-color: #f8f8f8;" />
              <span style="font-size: 0.75rem; color: #6b7280; display: block; margin-top: 6px;">Clean White (After)</span>
            </div>
          </div>
        </div>

        <div style="border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
          <h2 style="font-size: 1.4rem; font-weight: 600; margin-top: 0; margin-bottom: 8px; color: #111;">Clipping Path</h2>
          <p style="font-size: 0.9rem; color: #4b5563; margin-bottom: 16px;">Precision hand-drawn vector paths around product edges for crisp hard-edge cutouts.</p>
          <div style="display: flex; gap: 12px;">
            <div style="flex: 1; text-align: center;">
              <img src="https://res.cloudinary.com/dnmj4altq/image/upload/f_auto,q_auto,w_500/reframe/services/clipping-path-before.jpg" alt="Clipping Path - Hard-edged product before vector path isolation" style="width: 100%; height: auto; border-radius: 8px; background-color: #f8f8f8;" />
              <span style="font-size: 0.75rem; color: #6b7280; display: block; margin-top: 6px;">Original (Before)</span>
            </div>
            <div style="flex: 1; text-align: center;">
              <img src="https://res.cloudinary.com/dnmj4altq/image/upload/f_auto,q_auto,w_500/reframe/services/clipping-path-after.jpg" alt="Clipping Path - High-precision vector cutout of the product" style="width: 100%; height: auto; border-radius: 8px; background-color: #f8f8f8;" />
              <span style="font-size: 0.75rem; color: #6b7280; display: block; margin-top: 6px;">Vector Cutout (After)</span>
            </div>
          </div>
        </div>

        <div style="border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
          <h2 style="font-size: 1.4rem; font-weight: 600; margin-top: 0; margin-bottom: 8px; color: #111;">Ghost Mannequin</h2>
          <p style="font-size: 0.9rem; color: #4b5563; margin-bottom: 16px;">Seamless neck joint splicing to remove the physical mannequin while preserving inner collars and tags.</p>
          <div style="display: flex; gap: 12px;">
            <div style="flex: 1; text-align: center;">
              <img src="https://res.cloudinary.com/dnmj4altq/image/upload/f_auto,q_auto,w_500/reframe/services/ghost-mannequin-before.jpg" alt="Ghost Mannequin - Apparel on a physical mannequin structure before composite" style="width: 100%; height: auto; border-radius: 8px; background-color: #f8f8f8;" />
              <span style="font-size: 0.75rem; color: #6b7280; display: block; margin-top: 6px;">Mannequin (Before)</span>
            </div>
            <div style="flex: 1; text-align: center;">
              <img src="https://res.cloudinary.com/dnmj4altq/image/upload/f_auto,q_auto,w_500/reframe/services/ghost-mannequin-after.jpg" alt="Ghost Mannequin - 3D hollow clothing presentation after mannequin removal" style="width: 100%; height: auto; border-radius: 8px; background-color: #f8f8f8;" />
              <span style="font-size: 0.75rem; color: #6b7280; display: block; margin-top: 6px;">3D Hollow (After)</span>
            </div>
          </div>
        </div>

        <div style="border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
          <h2 style="font-size: 1.4rem; font-weight: 600; margin-top: 0; margin-bottom: 8px; color: #111;">Jewelry Retouching</h2>
          <p style="font-size: 0.9rem; color: #4b5563; margin-bottom: 16px;">Macro-level detail cleaning: gold/silver metal polishing, dust and scratch removal, gemstone facet enhancement.</p>
          <div style="display: flex; gap: 12px;">
            <div style="flex: 1; text-align: center;">
              <img src="https://res.cloudinary.com/dnmj4altq/image/upload/f_auto,q_auto,w_500/reframe/services/jewelry-retouch-before.jpg" alt="Jewelry Retouching - Raw jewelry photo with minor dust and scratch blemishes" style="width: 100%; height: auto; border-radius: 8px; background-color: #f8f8f8;" />
              <span style="font-size: 0.75rem; color: #6b7280; display: block; margin-top: 6px;">Raw Shot (Before)</span>
            </div>
            <div style="flex: 1; text-align: center;">
              <img src="https://res.cloudinary.com/dnmj4altq/image/upload/f_auto,q_auto,w_500/reframe/services/jewelry-retouch-after.jpg" alt="Jewelry Retouching - Cleaned, polished and sparkling high-end jewelry render" style="width: 100%; height: auto; border-radius: 8px; background-color: #f8f8f8;" />
              <span style="font-size: 0.75rem; color: #6b7280; display: block; margin-top: 6px;">Polished (After)</span>
            </div>
          </div>
        </div>

        <div style="border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
          <h2 style="font-size: 1.4rem; font-weight: 600; margin-top: 0; margin-bottom: 8px; color: #111;">Color Correction & Change</h2>
          <p style="font-size: 0.9rem; color: #4b5563; margin-bottom: 16px;">Calibrate white balance and swap product colors digitally while preserving textile details and shading.</p>
          <div style="display: flex; gap: 12px;">
            <div style="flex: 1; text-align: center;">
              <img src="https://res.cloudinary.com/dnmj4altq/image/upload/f_auto,q_auto,w_500/reframe/services/color-change-before.jpg" alt="Color Change - Product in base colorway before swap" style="width: 100%; height: auto; border-radius: 8px; background-color: #f8f8f8;" />
              <span style="font-size: 0.75rem; color: #6b7280; display: block; margin-top: 6px;">Base Color (Before)</span>
            </div>
            <div style="flex: 1; text-align: center;">
              <img src="https://res.cloudinary.com/dnmj4altq/image/upload/f_auto,q_auto,w_500/reframe/services/color-change-after.jpg" alt="Color Change - Product digitally swapped to a different colorway option" style="width: 100%; height: auto; border-radius: 8px; background-color: #f8f8f8;" />
              <span style="font-size: 0.75rem; color: #6b7280; display: block; margin-top: 6px;">Swapped Color (After)</span>
            </div>
          </div>
        </div>

        <div style="border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
          <h2 style="font-size: 1.4rem; font-weight: 600; margin-top: 0; margin-bottom: 8px; color: #111;">Shadow Creation</h2>
          <p style="font-size: 0.9rem; color: #4b5563; margin-bottom: 16px;">Reconstruct natural drop shadows, reflections, and contact shadows to ground the product realistically.</p>
          <div style="display: flex; gap: 12px;">
            <div style="flex: 1; text-align: center;">
              <img src="https://res.cloudinary.com/dnmj4altq/image/upload/f_auto,q_auto,w_500/reframe/services/shadow-creation-before.jpg" alt="Shadow Creation - Flat product cutout without natural floor shadows" style="width: 100%; height: auto; border-radius: 8px; background-color: #f8f8f8;" />
              <span style="font-size: 0.75rem; color: #6b7280; display: block; margin-top: 6px;">Flat Cutout (Before)</span>
            </div>
            <div style="flex: 1; text-align: center;">
              <img src="https://res.cloudinary.com/dnmj4altq/image/upload/f_auto,q_auto,w_500/reframe/services/shadow-creation-after.jpg" alt="Shadow Creation - Product with natural ground shadow adding realism" style="width: 100%; height: auto; border-radius: 8px; background-color: #f8f8f8;" />
              <span style="font-size: 0.75rem; color: #6b7280; display: block; margin-top: 6px;">Grounded (After)</span>
            </div>
          </div>
        </div>
      </div>

      <div style="border-top: 1px solid #eee; padding-top: 2rem; text-align: center; margin-bottom: 2rem;">
        <h3 style="font-size: 1.5rem; margin-top: 0; margin-bottom: 12px; color: #111;">What Clients Say About Reframe Visuals</h3>
        <p style="color: #4b5563; max-width: 600px; margin: 0 auto 20px;">Verified testimonials from ecommerce founders, brand owners, and catalog teams who use Reframe Visuals.</p>
        <div style="display: flex; flex-direction: column; gap: 16px; max-width: 700px; margin: 0 auto; text-align: left;">
          <blockquote style="border-left: 4px solid #111; padding-left: 16px; margin: 0;">
            <p style="font-style: italic; color: #1f2937; margin: 0 0 4px;">"Probably the best seller I have worked with on this platform. Awesome pricing &amp; highest possible result. Everything done to the smallest details. They really know how to use PS. Will definitely work with them in the long run."</p>
            <cite style="font-size: 0.8rem; color: #6b7280; font-style: normal;">— Nikola Filić, Founder &amp; Creative Director, Bomber Clothing</cite>
          </blockquote>
          <blockquote style="border-left: 4px solid #111; padding-left: 16px; margin: 0;">
            <p style="font-style: italic; color: #1f2937; margin: 0 0 4px;">"Great communication, very efficient and excellent job every time. Handled everything exceptionally and went above and beyond."</p>
            <cite style="font-size: 0.8rem; color: #6b7280; font-style: normal;">— Suril, Founder, Acia Studio</cite>
          </blockquote>
          <blockquote style="border-left: 4px solid #111; padding-left: 16px; margin: 0;">
            <p style="font-style: italic; color: #1f2937; margin: 0 0 4px;">"Amazing job, as always. Third time repeat customer. Very responsive and always overdelivers!"</p>
            <cite style="font-size: 0.8rem; color: #6b7280; font-style: normal;">— Jamie, Founder, The Pup Pack</cite>
          </blockquote>
          <blockquote style="border-left: 4px solid #111; padding-left: 16px; margin: 0;">
            <p style="font-style: italic; color: #1f2937; margin: 0 0 4px;">"Prompt and quality work. I look forward to working with Reframe many times in the future."</p>
            <cite style="font-size: 0.8rem; color: #6b7280; font-style: normal;">— Todd Carli, Owner, Todd Carli Custom Carpentry</cite>
          </blockquote>
        </div>
      </div>
    `;
  }

  // DEFAULT FALLBACK
  return `
    <h1 style="font-size: 2.5rem; font-weight: 700; margin-bottom: 1.5rem; color: #111;">Reframe Visuals | Professional E-commerce Photo Editing</h1>
    <p style="font-size: 1.125rem; line-height: 1.8; color: #374151; margin-bottom: 1.5rem;">
      Professional e-commerce product photo editing studio. We combine human Photoshop precision with AI-assisted workflows to deliver catalog-ready images for ecommerce brands, Amazon sellers, fashion labels, and agencies.
    </p>
    <p style="line-height: 1.75; color: #374151; margin-bottom: 1.25rem;">
      Services include background removal, clipping path, ghost mannequin editing, jewelry retouching, garment retouching, model retouching, color correction, shadow creation, image manipulation, AI product photography, and AI image refinement.
    </p>
  `;
}

const DIRECTORY_MAIN_PAGES: Array<[string, string]> = [
  ['/', 'Home'],
  ['/services', 'All Services'],
  ['/pricing', 'Pricing'],
  ['/portfolio', 'Portfolio'],
  ['/about', 'About Us'],
  ['/blog', 'Blog & Guides'],
  ['/case-studies', 'Case Studies'],
  ['/resources', 'Resources'],
  ['/free-trial', 'Free Trial (3 Sample Edits)'],
  ['/contact', 'Contact'],
  ['/quality-assurance-process', 'Quality Assurance Process'],
  ['/turnaround-sla', 'Turnaround SLA'],
];

const DIRECTORY_COMPANY_PAGES: Array<[string, string]> = [
  ['/who-is-reframe-visuals', 'Who Is Reframe Visuals?'],
  ['/reframe-visuals-brand-facts', 'Brand Facts'],
  ['/reframe-visuals-reviews', 'Client Reviews'],
  ['/reframe-visuals-pricing', 'Pricing Overview'],
  ['/reframe-visuals-services', 'Services Overview'],
  ['/free-sample-edit', 'Free Sample Edit'],
  ['/reframe-visuals-for-shopify-brands', 'For Shopify Brands'],
  ['/reframe-visuals-for-amazon-sellers', 'For Amazon Sellers'],
  ['/pixelz-alternative', 'Pixelz Alternative'],
  ['/clipping-path-india-alternative', 'Clipping Path India Alternative'],
  ['/cutoutwiz-alternative', 'CutoutWiz Alternative'],
];

/**
 * Renders a plain-HTML site directory appended to every SSR/noscript page so
 * crawlers that do not execute JavaScript (most AI crawlers, default SEO
 * spiders) can discover the full site from any entry page. The React app
 * renders navigation client-side only, so without this block the raw HTML of
 * most routes contains no internal links.
 */
function renderSiteDirectory(): string {
  const link = (href: string, label: string) =>
    `<li style="margin-bottom: 0.4rem;"><a href="${href}" style="color: #1f2937; text-decoration: underline;">${label}</a></li>`;

  const mainLinks = DIRECTORY_MAIN_PAGES.map(([href, label]) => link(href, label)).join('\n');
  const serviceLinks = SEO_SERVICES.map(service => link(`/services/${service.id}`, `${service.name} (from $${service.price.toFixed(2)}/image)`)).join('\n');
  const blogLinks = posts.map(post => link(`/blog/${post.slug}`, post.title)).join('\n');
  const companyLinks = DIRECTORY_COMPANY_PAGES.map(([href, label]) => link(href, label)).join('\n');

  return `
    <nav aria-label="Site directory" style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #eee;">
      <h2 style="font-size: 1.5rem; font-weight: 600; margin-bottom: 1rem; color: #111;">Explore Reframe Visuals</h2>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px;">
        <div>
          <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.75rem; color: #111;">Main Pages</h3>
          <ul style="list-style: none; margin: 0; padding: 0;">
${mainLinks}
          </ul>
        </div>
        <div>
          <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.75rem; color: #111;">Editing Services</h3>
          <ul style="list-style: none; margin: 0; padding: 0;">
${serviceLinks}
          </ul>
        </div>
        <div>
          <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.75rem; color: #111;">Guides & Articles</h3>
          <ul style="list-style: none; margin: 0; padding: 0;">
${blogLinks}
          </ul>
        </div>
        <div>
          <h3 style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.75rem; color: #111;">About the Company</h3>
          <ul style="list-style: none; margin: 0; padding: 0;">
${companyLinks}
          </ul>
        </div>
      </div>
    </nav>
  `;
}

/**
 * Generates crawlable HTML for bot fallbacks inside <noscript>: the per-route
 * content followed by a site-wide link directory for crawl discovery.
 */
export function generateSeoContent(pathname: string): string {
  return generateRouteContent(pathname) + renderSiteDirectory();
}

