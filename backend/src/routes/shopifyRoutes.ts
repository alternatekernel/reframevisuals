import { Router } from 'express';
import { shopifyService } from '../services/shopifyService';
import { authenticate, requireStaff } from '../middleware/auth';

const router = Router();

/**
 * @route GET /api/shopify/products
 * @desc Get products from connected Shopify store
 * @access Private (Requires staff role)
 */
router.get('/products', [authenticate, requireStaff], async (req: any, res: any) => {
  const { shop, accessToken } = req.query; // In production, these should come from the DB/Session

  if (!shop || !accessToken) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing shop domain or access token.' 
    });
  }

  try {
    const products = await shopifyService.getProducts(shop as string, accessToken as string);
    res.json({ success: true, data: products });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route POST /api/shopify/auth
 * @desc Initiate Shopify OAuth flow (Placeholder)
 */
router.post('/auth', [authenticate, requireStaff], (req: any, res: any) => {
  const { shop } = req.body;
  if (!shop) return res.status(400).json({ message: 'Shop domain required' });

  // In production: Redirect to Shopify OAuth URL
  res.json({ 
    success: true, 
    message: 'OAuth flow initiated',
    redirectUrl: `https://${shop}/admin/oauth/authorize?client_id=REPLACE_ME&scope=read_products,write_products&redirect_uri=REPLACE_ME`
  });
});

export default router;
