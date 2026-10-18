import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cx, layout, tokens, typography } from '../../utils/theme';

const FAQ_ITEMS = [
  {
    question: 'What is Reframe Visuals?',
    answer: 'Reframe Visuals is a professional e-commerce photo editing studio. We help online brands produce clean, conversion-focused product images at scale through expert retouching and post-production. We are not a video reframing app or AI reframing software.'
  },
  {
    question: 'What services does Reframe Visuals offer?',
    answer: 'We offer background removal, clipping path, ghost mannequin editing, jewelry retouching, garment retouching, model retouching, color correction, shadow creation, image manipulation, AI product photography, and AI-assisted image refinement for e-commerce brands.'
  },
  {
    question: 'How does the free trial work?',
    answer: 'New customers can upload up to 3 product photos to evaluate our quality before placing a paid order. No credit card is required. Free trial samples are delivered within 24 hours of submission.'
  },
  {
    question: 'What is your turnaround time?',
    answer: 'We offer 24-48 hour standard turnaround, with 12-hour express and 72-hour economy options available. Every order includes unlimited revisions at no extra cost.'
  },
  {
    question: 'Who does Reframe Visuals serve?',
    answer: 'We serve e-commerce brands, Amazon sellers, jewelry brands, apparel brands, product photographers, agencies, and marketplace teams that need consistent visual output at scale.'
  },
  {
    question: 'How do you ensure quality?',
    answer: 'Every project has a dedicated editor and a QA reviewer before delivery. We use a dual-stage manual inspection workflow where senior visual editors verify all assets against strict checklists for edge precision, lighting, and color accuracy.'
  },
  {
    question: 'What makes Reframe Visuals different?',
    answer: 'We don\'t automate what requires a human eye. Every edit is handled by experienced editors who have worked through thousands of commercial product images. We respond within 30 minutes and offer unlimited revisions on every order.'
  },
  {
    question: 'How can I contact Reframe Visuals?',
    answer: 'You can contact us through our website at reframevisuals.com/contact, or by email at hello@reframevisuals.com. We respond to all inquiries within 30 minutes during business hours.'
  }
];

const AboutFAQ = () => {
  return (
    <section className="px-5 sm:px-6 lg:px-12 pt-10 pb-12 sm:pt-12 sm:pb-14 lg:pt-16 lg:pb-20 bg-[#fafafa] overflow-hidden">
      <div className={cx(layout.compactShell, "relative z-10")}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-4xl mx-auto mb-10 sm:mb-16"
        >
          <h2 className={cx(typography.vercelSection, "text-[#171717] mb-4")}>
            Frequently Asked <span className="text-black/40">Questions</span>
          </h2>
          <p className="text-[16px] text-black/60 max-w-2xl mx-auto">
            Common questions about Reframe Visuals and our e-commerce photo editing services.
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-4">
          {FAQ_ITEMS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className={cx(
                "p-5 sm:p-6 bg-white border border-black/[0.18]",
                tokens.radiusCard
              )}
              style={{ boxShadow: tokens.shadowStandard }}
            >
              <h3 className="text-[16px] sm:text-[18px] font-heading font-bold text-[var(--color-text-primary)] mb-3">
                {item.question}
              </h3>
              <p className="text-[16px] text-black/60 leading-relaxed">
                {item.answer}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          <p className="text-[16px] text-black/60 mb-4">
            Still have questions? We're here to help.
          </p>
          <Link
            to="/contact"
            className="inline-block px-6 py-3 bg-[var(--color-text-primary)] text-white rounded-full font-bold hover:bg-black/90 transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </section>
  );
};

export default AboutFAQ;
