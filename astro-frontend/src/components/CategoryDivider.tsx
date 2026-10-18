import React from 'react';
import { motion } from 'framer-motion';

interface CategoryDividerProps {
  label: string;
  color: string;
  description?: string;
}

const CategoryDivider: React.FC<CategoryDividerProps> = ({ label, color, description }) => (
  <motion.div
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="flex items-center gap-6 lg:gap-8 py-4"
  >
    <div className="flex items-center gap-3">
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}40` }}
      />
      <h3 className="font-heading text-[14px] lg:text-[16px] font-black tracking-[-0.03em]">
        {label}
      </h3>
      {description && (
        <span className="hidden lg:block text-[12px] font-medium text-black/30 tracking-widest">
          {description}
        </span>
      )}
    </div>
    <div className="flex-1 h-[1px] bg-black/[0.06]" />
  </motion.div>
);

export default CategoryDivider;
