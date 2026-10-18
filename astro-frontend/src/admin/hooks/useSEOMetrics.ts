import { useState, useEffect } from 'react';

interface SEOMetrics {
  topKeywordsByCluster: {
    services: string[];
    industries: string[];
    geo: string[];
  };
  trialConversions: {
    quoteBuilder: number;
    freeTrial: number;
    freeSampleEdit: number;
  };
  leadsByPageType: {
    caseStudies: number;
    geoPages: number;
    industryPages: number;
  };
}

export const useSEOMetrics = () => {
  const [metrics, setMetrics] = useState<SEOMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSEOMetrics = async () => {
      try {
        // Try to fetch from backend API
        const response = await fetch('/api/seo/metrics');
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        } else {
          // Fallback to local data for development
          setMetrics({
            topKeywordsByCluster: {
              services: ['photo editing', 'product photography', 'ecommerce', 'Amazon', 'shopify', 'clipping path', 'background removal', 'ghost mannequin', 'jewelry retouching'],
              industries: ['Amazon product image editing', 'Shopify product photo editing', 'fashion photo retouching', 'jewelry photo retouching', 'furniture photo editing'],
              geo: ['US photo editing service', 'UK photo editing service', 'Canada photo editing service', 'Australia photo editing service', 'UAE photo editing service']
            },
            trialConversions: {
              quoteBuilder: 0,
              freeTrial: 0,
              freeSampleEdit: 0
            },
            leadsByPageType: {
              caseStudies: 0,
              geoPages: 0,
              industryPages: 0
            }
          });
        }
      } catch (error) {
        console.error('Failed to fetch SEO metrics:', error);
        // Fallback data
        setMetrics({
          topKeywordsByCluster: {
            services: ['photo editing', 'product photography', 'ecommerce', 'Amazon', 'shopify'],
            industries: ['Amazon product image editing', 'Shopify product photo editing'],
            geo: ['US photo editing service', 'UK photo editing service']
          },
          trialConversions: {
            quoteBuilder: 0,
            freeTrial: 0,
            freeSampleEdit: 0
          },
          leadsByPageType: {
            caseStudies: 0,
            geoPages: 0,
            industryPages: 0
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSEOMetrics();
    // Refresh every 5 minutes
    const interval = setInterval(fetchSEOMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { metrics, loading };
};
