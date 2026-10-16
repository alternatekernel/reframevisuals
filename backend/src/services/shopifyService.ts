import axios from 'axios';

/**
 * Reframe Shopify Service
 * Handles interaction with Shopify Admin API for product and asset synchronization.
 */

export interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  images: ShopifyImage[];
}

export interface ShopifyImage {
  id: number;
  product_id: number;
  src: string;
  width: number;
  height: number;
}

export class ShopifyService {
  private static instance: ShopifyService;

  private constructor() {}

  public static getInstance(): ShopifyService {
    if (!ShopifyService.instance) {
      ShopifyService.instance = new ShopifyService();
    }
    return ShopifyService.instance;
  }

  /**
   * Fetches products from a connected Shopify store.
   * @param shop The shop domain (e.g. store.myshopify.com)
   * @param accessToken The OAuth access token for the shop
   */
  public async getProducts(shop: string, accessToken: string): Promise<ShopifyProduct[]> {
    try {
      const response = await axios.get(`https://${shop}/admin/api/2024-04/products.json`, {
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json',
        },
      });

      return response.data.products;
    } catch (error: any) {
      console.error(`[ShopifyService] Error fetching products for ${shop}:`, error.message);
      throw new Error('Failed to retrieve Shopify products.');
    }
  }

  /**
   * Pushes a retouched image back to a Shopify product.
   * @param shop The shop domain
   * @param accessToken OAuth token
   * @param productId Shopify Product ID
   * @param imageUrl The URL of the retouched asset on Reframe storage
   */
  public async pushRetouchedImage(
    shop: string, 
    accessToken: string, 
    productId: number, 
    imageUrl: string
  ): Promise<ShopifyImage> {
    try {
      const response = await axios.post(
        `https://${shop}/admin/api/2024-04/products/${productId}/images.json`,
        {
          image: {
            src: imageUrl,
            metafields: [
              {
                key: 'reframe_status',
                value: 'retouched',
                type: 'single_line_text_field',
                namespace: 'reframe'
              }
            ]
          }
        },
        {
          headers: {
            'X-Shopify-Access-Token': accessToken,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.image;
    } catch (error: any) {
      console.error(`[ShopifyService] Error pushing image to Shopify:`, error.message);
      throw new Error('Failed to push asset to Shopify.');
    }
  }
}

export const shopifyService = ShopifyService.getInstance();
