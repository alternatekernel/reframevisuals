import { motion } from 'framer-motion';
import { layout, cx } from '../utils/theme';

const PreFooter = () => {
  return (
    <section className="bg-white">
      {/* Thin brand black line */}
      <div className="w-full h-[1px] bg-[#0A0A0B]/10" />
      
      <div className={cx("pt-12 lg:pt-20 pb-0", layout.sectionGutter)}>
        <div className={cx(layout.contentShell, "flex justify-center items-center")}>
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="w-full max-w-7xl"
          >
            <img 
              src="/above-footer.svg" 
              alt="Reframe Visuals - ecommerce photo editing services branding artwork" 
              className="w-full h-auto object-contain select-none"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PreFooter;
