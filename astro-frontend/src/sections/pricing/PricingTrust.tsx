import { motion } from 'framer-motion';
import { cx, layout, typography } from '../../utils/theme';

const PricingTrust = () => {
  const logos = [
    { name: 'E-com Plus', src: '/logo.svg' },
    { name: 'Visual Studio', src: '/logo.svg' },
    { name: 'Frame.io', src: '/logo.svg' },
    { name: 'Adobe', src: '/logo.svg' },
    { name: 'Vercel', src: '/logo.svg' },
  ];

  return (
    <section className="py-24 bg-white border-y border-[#ebebeb]">
      <div className={cx(layout.compactShell, "px-6 lg:px-12")}>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex flex-col items-center"
        >
          <p className={cx(typography.vercelMono, "mb-12 text-center")}>
            Trusted by innovative teams worldwide
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-12 lg:gap-16 items-center opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
            {logos.map((logo, i) => (
              <div key={i} className="flex justify-center">
                <img 
                  src={logo.src} 
                  alt={`${logo.name} - trusted partner of Reframe Visuals`} 
                  className="h-8 lg:h-10 w-auto object-contain"
                />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingTrust;
