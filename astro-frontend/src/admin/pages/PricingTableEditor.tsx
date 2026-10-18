import React, { useState, useEffect } from 'react';
import { useContent } from '../../context/ContentBase';
import { SpreadsheetGrid, PricingRow } from '../components/SpreadsheetGrid';
import { sortServicesByDisplayOrder } from '../../data/services';

type Tab = 'services' | 'bundles' | 'matrix' | 'plans';

export const PricingTableEditor: React.FC = () => {
  const { getSectionContent, setSectionContent } = useContent();
  const [tab, setTab] = useState<Tab>('services');
  const [services, setServices] = useState<any[]>(() => getSectionContent('services').services || []);
  const [bundles, setBundles] = useState<any[]>(() => getSectionContent('bundles').bundles || []);
  const [matrixRows, setMatrixRows] = useState<PricingRow[]>(() => getSectionContent('pricingMatrix').rows || []);
  const [plans, setPlans] = useState<any[]>(() => getSectionContent('pricingPlans').plans || []);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const orderedServices = sortServicesByDisplayOrder(services as any[]);

  // Sync back to content context on every change
  useEffect(() => {
    if (services.length > 0) setSectionContent('services', { services });
  }, [services, setSectionContent]);
  useEffect(() => {
    if (bundles.length > 0) setSectionContent('bundles', { bundles });
  }, [bundles, setSectionContent]);
  useEffect(() => {
    setSectionContent('pricingMatrix', { rows: matrixRows });
  }, [matrixRows, setSectionContent]);
  useEffect(() => {
    if (plans.length > 0) setSectionContent('pricingPlans', { plans });
  }, [plans, setSectionContent]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'services', label: 'Services' },
    { id: 'bundles', label: 'Bundles' },
    { id: 'matrix', label: 'Price Matrix' },
    { id: 'plans', label: 'Pricing Cards' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-bold text-gray-900 tracking-tight">Pricing</h1>
        <p className="mt-1 text-[15px] text-gray-500">All pricing for your platform in one place.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setExpandedId(null); }}
            className={`px-4 py-2 rounded-md text-[15px] font-medium transition-all ${
              tab === t.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Services tab */}
      {tab === 'services' && (
        <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
          <table className="w-full text-[15px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-[14px] uppercase tracking-wider">Service</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-[14px] uppercase tracking-wider">Category</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 text-[14px] uppercase tracking-wider">Base Price</th>
              </tr>
            </thead>
            <tbody>
              {orderedServices.map((svc) => {
                const i = services.findIndex(s => s.id === svc.id);
                return (
                <React.Fragment key={svc.id}>
                  <tr
                    className={`border-b border-gray-50 cursor-pointer hover:bg-gray-50/50 transition-colors ${expandedId === svc.id ? 'bg-gray-50/50' : ''}`}
                    onClick={() => setExpandedId(expandedId === svc.id ? null : svc.id)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-300 transition-transform ${expandedId === svc.id ? 'rotate-90' : ''}`}>
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                        <span className="font-medium text-gray-900">{svc.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-400">{svc.categoryId}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono font-medium text-gray-900">${svc.price}</span>
                      <span className="text-gray-400">/img</span>
                    </td>
                  </tr>
                  {expandedId === svc.id && (
                    <tr className="bg-gray-50/30">
                      <td colSpan={3} className="px-4 py-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[14px] font-medium text-gray-500 mb-1">Service Name</label>
                            <input
                              type="text"
                              value={svc.name}
                              onChange={e => {
                                const copy = [...services];
                                copy[i] = { ...copy[i], name: e.target.value };
                                setServices(copy);
                              }}
                              className="w-full h-8 border border-gray-200 rounded-md px-2.5 text-[14px] focus:outline-none focus:ring-1 focus:ring-gray-900/10"
                            />
                          </div>
                          <div>
                            <label className="block text-[14px] font-medium text-gray-500 mb-1">Base Price ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={svc.price}
                              onChange={e => {
                                const copy = [...services];
                                copy[i] = { ...copy[i], price: parseFloat(e.target.value) || 0 };
                                setServices(copy);
                              }}
                              className="w-full h-8 border border-gray-200 rounded-md px-2.5 text-[14px] focus:outline-none focus:ring-1 focus:ring-gray-900/10"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-[14px] font-medium text-gray-500 mb-1">Description</label>
                            <input
                              type="text"
                              value={svc.description}
                              onChange={e => {
                                const copy = [...services];
                                copy[i] = { ...copy[i], description: e.target.value };
                                setServices(copy);
                              }}
                              className="w-full h-8 border border-gray-200 rounded-md px-2.5 text-[14px] focus:outline-none focus:ring-1 focus:ring-gray-900/10"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )})}
            </tbody>
          </table>
          {services.length === 0 && (
            <div className="py-12 text-center text-[15px] text-gray-400">No services loaded</div>
          )}
        </div>
      )}

      {/* Bundles tab */}
      {tab === 'bundles' && (
        <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
          <table className="w-full text-[15px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-[14px] uppercase tracking-wider">Bundle</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-[14px] uppercase tracking-wider">Savings</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 text-[14px] uppercase tracking-wider">Price</th>
              </tr>
            </thead>
            <tbody>
              {bundles.map((bnd, i) => (
                <React.Fragment key={bnd.id}>
                  <tr
                    className={`border-b border-gray-50 cursor-pointer hover:bg-gray-50/50 transition-colors ${expandedId === bnd.id ? 'bg-gray-50/50' : ''}`}
                    onClick={() => setExpandedId(expandedId === bnd.id ? null : bnd.id)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-300 transition-transform ${expandedId === bnd.id ? 'rotate-90' : ''}`}>
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                        <span className="font-medium text-gray-900">{bnd.name}</span>
                        {bnd.highlight && <span className="text-[14px] text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded font-medium">Popular</span>}
                      </div>
                      <div className="text-[14px] text-gray-400 ml-5 mt-0.5">{bnd.description}</div>
                    </td>
                    <td className="py-3 px-4 text-emerald-600 text-[14px] font-medium">{bnd.savings}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono font-medium text-gray-900">${bnd.price}</span>
                      <span className="text-gray-400">/img</span>
                    </td>
                  </tr>
                  {expandedId === bnd.id && (
                    <tr className="bg-gray-50/30">
                      <td colSpan={3} className="px-4 py-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[14px] font-medium text-gray-500 mb-1">Bundle Name</label>
                            <input
                              type="text"
                              value={bnd.name}
                              onChange={e => {
                                const copy = [...bundles];
                                copy[i] = { ...copy[i], name: e.target.value };
                                setBundles(copy);
                              }}
                              className="w-full h-8 border border-gray-200 rounded-md px-2.5 text-[14px] focus:outline-none focus:ring-1 focus:ring-gray-900/10"
                            />
                          </div>
                          <div>
                            <label className="block text-[14px] font-medium text-gray-500 mb-1">Price ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={bnd.price}
                              onChange={e => {
                                const copy = [...bundles];
                                copy[i] = { ...copy[i], price: parseFloat(e.target.value) || 0 };
                                setBundles(copy);
                              }}
                              className="w-full h-8 border border-gray-200 rounded-md px-2.5 text-[14px] focus:outline-none focus:ring-1 focus:ring-gray-900/10"
                            />
                          </div>
                          <div>
                            <label className="block text-[14px] font-medium text-gray-500 mb-1">Savings Label</label>
                            <input
                              type="text"
                              value={bnd.savings}
                              onChange={e => {
                                const copy = [...bundles];
                                copy[i] = { ...copy[i], savings: e.target.value };
                                setBundles(copy);
                              }}
                              className="w-full h-8 border border-gray-200 rounded-md px-2.5 text-[14px] focus:outline-none focus:ring-1 focus:ring-gray-900/10"
                            />
                          </div>
                          <div>
                            <label className="block text-[14px] font-medium text-gray-500 mb-1">Description</label>
                            <input
                              type="text"
                              value={bnd.description}
                              onChange={e => {
                                const copy = [...bundles];
                                copy[i] = { ...copy[i], description: e.target.value };
                                setBundles(copy);
                              }}
                              className="w-full h-8 border border-gray-200 rounded-md px-2.5 text-[14px] focus:outline-none focus:ring-1 focus:ring-gray-900/10"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {bundles.length === 0 && (
            <div className="py-12 text-center text-[15px] text-gray-400">No bundles loaded</div>
          )}
        </div>
      )}

      {/* Price Matrix tab - Spreadsheet interface */}
      {tab === 'matrix' && (
        <SpreadsheetGrid
          rows={matrixRows}
          onChange={setMatrixRows}
        />
      )}

      {/* Pricing Plans tab */}
      {tab === 'plans' && (
        <div className="bg-white rounded-xl border border-gray-200/80 overflow-hidden">
          <table className="w-full text-[15px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-[14px] uppercase tracking-wider">Plan</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-[14px] uppercase tracking-wider">Savings</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500 text-[14px] uppercase tracking-wider">Price</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan, i) => (
                <React.Fragment key={i}>
                  <tr
                    className={`border-b border-gray-50 cursor-pointer hover:bg-gray-50/50 transition-colors ${expandedId === `plan-${i}` ? 'bg-gray-50/50' : ''}`}
                    onClick={() => setExpandedId(expandedId === `plan-${i}` ? null : `plan-${i}`)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`text-gray-300 transition-transform ${expandedId === `plan-${i}` ? 'rotate-90' : ''}`}>
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                        <span className="font-medium text-gray-900">{plan.name}</span>
                        {plan.popular && <span className="text-[14px] text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded font-medium">Popular</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-emerald-600 text-[14px] font-medium">{plan.savings}</td>
                    <td className="py-3 px-4 text-right">
                      {plan.price !== null ? (
                        <>
                          <span className="font-mono font-medium text-gray-900">${plan.price}</span>
                          <span className="text-gray-400">/{plan.perUnit || 'img'}</span>
                        </>
                      ) : (
                        <span className="text-gray-500 font-medium">Custom</span>
                      )}
                    </td>
                  </tr>
                  {expandedId === `plan-${i}` && (
                    <tr className="bg-gray-50/30">
                      <td colSpan={3} className="px-4 py-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[14px] font-medium text-gray-500 mb-1">Plan Name</label>
                            <input
                              type="text"
                              value={plan.name}
                              onChange={e => {
                                const copy = [...plans];
                                copy[i] = { ...copy[i], name: e.target.value };
                                setPlans(copy);
                              }}
                              className="w-full h-8 border border-gray-200 rounded-md px-2.5 text-[14px] focus:outline-none focus:ring-1 focus:ring-gray-900/10"
                            />
                          </div>
                          <div>
                            <label className="block text-[14px] font-medium text-gray-500 mb-1">Price ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={plan.price ?? ''}
                              placeholder="Leave empty for custom"
                              onChange={e => {
                                const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                const copy = [...plans];
                                copy[i] = { ...copy[i], price: val };
                                setPlans(copy);
                              }}
                              className="w-full h-8 border border-gray-200 rounded-md px-2.5 text-[14px] focus:outline-none focus:ring-1 focus:ring-gray-900/10"
                            />
                          </div>
                          <div>
                            <label className="block text-[14px] font-medium text-gray-500 mb-1">Per Unit</label>
                            <input
                              type="text"
                              value={plan.perUnit || ''}
                              onChange={e => {
                                const copy = [...plans];
                                copy[i] = { ...copy[i], perUnit: e.target.value };
                                setPlans(copy);
                              }}
                              className="w-full h-8 border border-gray-200 rounded-md px-2.5 text-[14px] focus:outline-none focus:ring-1 focus:ring-gray-900/10"
                            />
                          </div>
                          <div>
                            <label className="block text-[14px] font-medium text-gray-500 mb-1">Savings Label</label>
                            <input
                              type="text"
                              value={plan.savings || ''}
                              onChange={e => {
                                const copy = [...plans];
                                copy[i] = { ...copy[i], savings: e.target.value };
                                setPlans(copy);
                              }}
                              className="w-full h-8 border border-gray-200 rounded-md px-2.5 text-[14px] focus:outline-none focus:ring-1 focus:ring-gray-900/10"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {plans.length === 0 && (
            <div className="py-12 text-center text-[15px] text-gray-400">No pricing plans loaded</div>
          )}
        </div>
      )}
    </div>
  );
};
