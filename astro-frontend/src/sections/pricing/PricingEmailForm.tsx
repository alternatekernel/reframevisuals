import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cx, layout } from '../../utils/theme';
import { PublicInput, publicInlineSubmitButtonClass } from '../../components/ui/form-controls';

const PricingEmailForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <section className="px-6 lg:px-12 py-20 bg-white">
      <div className={cx(layout.compactShell, "relative z-10")}>
        <div className="w-full max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center gap-8"
          >
            <div className="w-full space-y-4 text-center">
              <h3 className="text-[20px] lg:text-[24px] font-semibold text-[var(--color-text-primary)] tracking-tight">
                Need detailed pricing for your specific images?
              </h3>
              <p className="text-[15px] text-black/70 max-w-lg mx-auto leading-relaxed font-medium">
                Send us your email and sample images. We'll review and send you a personalized quote within ~30 minutes.
              </p>
              
              {submitted ? (
                <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-green-700 font-medium">Thanks! We'll be in touch soon with your custom quote.</p>
                </div>
              ) : (
                <form 
                  onSubmit={handleSubmit}
                  className="flex flex-col sm:flex-row gap-3 mt-8 max-w-md mx-auto"
                >
                  <PublicInput 
                    type="email" 
                    placeholder="Enter your work email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    shape="pill"
                    className="flex-1 border-black/15 focus:border-black/40"
                  />
                  <button 
                    type="submit"
                    className={publicInlineSubmitButtonClass}
                  >
                    Get Pricing Breakdown
                  </button>
                </form>
              )}
              <p className="text-[14px] text-black/50 font-medium">
                We'll analyze your images and provide accurate pricing tailored to your needs.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default PricingEmailForm;