import { describe, it, expect } from 'vitest';
import { generateSeoContent } from '../utils/seoContentGenerator';

describe('SEO Crawler Fallback HTML Content Generator', () => {
  it('generates rich before/after showcase content for the homepage (/)', () => {
    const html = generateSeoContent('/');
    
    expect(html).toContain('Reframe Visuals | Professional E-commerce Photo Editing Studio');
    expect(html).toContain('Featured Before & After Editing Showcase');
    expect(html).toContain('Background Removal');
    expect(html).toContain('background-removal-before.jpg');
    expect(html).toContain('background-removal-after.jpg');
    expect(html).toContain('Ghost Mannequin');
    expect(html).toContain('ghost-mannequin-before.jpg');
    expect(html).toContain('ghost-mannequin-after.jpg');
  });

  it('generates a rich visual gallery and testimonials for the portfolio page (/portfolio)', () => {
    const html = generateSeoContent('/portfolio');
    
    expect(html).toContain('Before & After Product Photo Editing Portfolio');
    expect(html).toContain('Background Removal');
    expect(html).toContain('background-removal-before.jpg');
    expect(html).toContain('background-removal-after.jpg');
    
    expect(html).toContain('Ghost Mannequin');
    expect(html).toContain('ghost-mannequin-before.jpg');
    
    expect(html).toContain('Jewelry Retouching');
    expect(html).toContain('jewelry-retouch-before.jpg');
    
    expect(html).toContain('Shadow Creation');
    expect(html).toContain('shadow-creation-before.jpg');
    
    expect(html).toContain('Real Customer Outcomes');
    expect(html).toContain('Marcus Chen');
    expect(html).toContain('Elena Rostova');
  });

  it('generates appropriate fallback for service-specific pages', () => {
    const html = generateSeoContent('/services/background-removal');
    expect(html).toContain('Background Removal Service for E-commerce');
    expect(html).toContain('Our professional Photoshop editors hand-craft');
  });
});
