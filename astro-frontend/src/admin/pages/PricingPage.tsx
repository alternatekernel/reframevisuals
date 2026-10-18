import React from 'react';
import { PieChart } from 'lucide-react';

export const PricingPage: React.FC = () => {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-[24px] font-bold text-[#2C2C2A]">Pricing Matrix</h1>
        <p className="text-[14px] text-[#757575] mt-1">Manage customer rates and editor payouts</p>
      </div>
      <div className="rounded-lg border border-[#E0E0E0] bg-white p-8 text-center">
        <PieChart size={48} className="mx-auto text-[#9E9E9E] mb-4" />
        <h3 className="text-[16px] font-semibold text-[#2C2C2A] mb-2">Pricing Matrix</h3>
        <p className="text-[15px] text-[#757575] max-w-md mx-auto">
          Configure customer pricing tiers, editor payout rates, and monitor margin health in real-time.
        </p>
      </div>
    </div>
  );
};
