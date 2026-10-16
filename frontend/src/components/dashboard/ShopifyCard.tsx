import React, { useState } from 'react';
import { ShoppingBag, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

interface ShopifyCardProps {
  onConnect?: (shop: string) => void;
  isConnected?: boolean;
  shopDomain?: string;
}

const ShopifyCard: React.FC<ShopifyCardProps> = ({ 
  onConnect, 
  isConnected = false, 
  shopDomain = '' 
}) => {
  const [shop, setShop] = useState(shopDomain);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="p-6 rounded-2xl transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        border: '1px solid var(--color-border-subtle)',
        backgroundColor: isHovered ? 'var(--color-surface-muted)' : '#ffffff',
        boxShadow: isHovered ? '0 8px 24px rgba(0,0,0,0.04)' : 'none'
      }}
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#95bf47' }}
          >
            <ShoppingBag color="#ffffff" size={24} />
          </div>
          <div>
            <h3 className="text-[16px] font-semibold text-text-primary">Storefront</h3>
            <p className="text-[12px] text-text-secondary">Sync products and automate delivery</p>
          </div>
        </div>
        {isConnected ? (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 text-green-600">
            <CheckCircle2 size={14} />
            <span className="text-[11px] font-medium uppercase tracking-wider">Connected</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-500">
            <AlertCircle size={14} />
            <span className="text-[11px] font-medium uppercase tracking-wider">Not Connected</span>
          </div>
        )}
      </div>

      {!isConnected ? (
        <div className="space-y-4">
          <div>
            <label className="text-[11px] font-medium uppercase tracking-widest block mb-2 text-text-muted">
              Store Domain
            </label>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="my-store.myshopify.com"
                value={shop}
                onChange={(e) => setShop(e.target.value)}
                className="flex-1 rounded-xl border border-[var(--color-border-light)] px-4 py-3 text-[14px] text-[var(--color-text-primary)] outline-none transition-[border-color,box-shadow] duration-200 focus:border-[var(--color-text-primary)] focus:ring-1 focus:ring-black/5"
              />
              <button 
                onClick={() => onConnect?.(shop)}
                className="rounded-lg bg-brand-ink px-4 py-2 text-[13px] font-medium text-white transition-all"
              >
                Connect
              </button>
            </div>
          </div>
          <p className="text-[11px] text-text-muted">
            Requires a Shopify Custom App or Partner credentials. 
            <a href="#" className="inline-flex items-center gap-0.5 ml-1 text-black font-medium">
              View Guide <ExternalLink size={10} />
            </a>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-dashed border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-[14px] font-medium text-text-primary">{shopDomain}</span>
              <button className="text-[13px] text-text-secondary hover:underline">
                Disconnect
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button className="py-2.5 rounded-lg text-[13px] font-medium bg-black text-white">
              Sync Catalog
            </button>
            <button className="py-2.5 rounded-lg text-[13px] font-medium border border-gray-200">
              Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopifyCard;
