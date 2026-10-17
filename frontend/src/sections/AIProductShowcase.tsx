import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Camera, Video, Sparkles, UserCheck, Upload } from 'lucide-react';
import { cx, typography } from '../utils/theme';

const PlaceholderImage = ({ className, icon: Icon, label, imageUrl, alt }: { className?: string, icon?: any, label?: string, imageUrl?: string, alt?: string }) => (
  <div className={`bg-black/[0.04] rounded-xl border border-black/[0.18] flex flex-col items-center justify-center text-black/40 overflow-hidden relative ${className}`}>
    {imageUrl ? (
      <img src={imageUrl} alt={alt || label} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
    ) : (
      <>
        {Icon && <Icon size={28} className="mb-3 opacity-40" />}
        {label && <span className="text-sm font-medium tracking-tight relative z-10">{label}</span>}
      </>
    )}
  </div>
);

const AIProductShowcase = () => {
  const navigate = useNavigate();

  const handleOrder = () => {
    navigate('/dashboard?view=new-project');
  };

  return (
    <section className="py-14 sm:py-16 lg:py-24 bg-white relative overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 space-y-32">
        
        {/* Photography Showcase */}
        <div className="space-y-16">
          <div className="text-center">
            <h2 className={cx(typography.displayLg, "text-text-primary")}>
              Intelligent scaling.<br />
              <span className="text-black/40">Pixel perfect results.</span>
            </h2>
          </div>

          <div className="flex flex-col xl:flex-row gap-12 lg:gap-16 items-start">
            {/* Left: Your Photo */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="flex-shrink-0 flex flex-col gap-5 items-center xl:items-start w-full xl:w-auto"
            >
              <h3 className="font-heading font-bold text-[18px] md:text-[20px] tracking-tight text-black/60 flex items-center gap-3">
                <Camera size={20} className="opacity-50" /> Your photo
              </h3>
              <PlaceholderImage 
                className="w-full max-w-[400px] xl:w-[320px] aspect-square shadow-sm rounded-xl"
                imageUrl="https://res.cloudinary.com/dnmj4altq/image/upload/v1778434550/reframe/showcase/ai-product-photography-original-photo.png"
                alt="Original Product Photo Before AI Enhancement" 
              />
              <button 
                onClick={handleOrder}
                className="w-full max-w-[400px] xl:w-[320px] bg-text-primary text-white py-4 px-6 rounded-xl font-heading font-bold text-14 tracking-tight hover:bg-black transition-all duration-300 flex items-center justify-center gap-2 group mt-2"
              >
                <Upload size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                Upload yours
              </button>
            </motion.div>

            {/* Right: AI & Human Process */}
            <div className="flex-1 flex flex-col gap-16 w-full">
              {/* AI Photography */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className="space-y-5"
              >
                <div className="flex items-center justify-between border-b border-black/[0.18] pb-4">
                  <h3 className="font-heading font-bold text-[18px] md:text-[20px] tracking-tight text-text-primary flex items-center gap-3">
                    <Sparkles size={20} className="text-brand" /> Our AI Product Photography service
                  </h3>
                  <span className="text-14 font-bold text-semantic-error flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-semantic-error animate-pulse" />
                    Instant delivery
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
                  {[
                    { id: 1, title: 'Cinematic Lighting', desc: 'Dramatic shadows and highlights.' },
                    { id: 2, title: 'Dynamic Composition', desc: 'Balanced perspective and flow.' },
                    { id: 3, title: 'Texture Enhancement', desc: 'Hyper-realistic surface detail.' },
                    { id: 5, title: 'Sharp Focus', desc: 'Crisp, high-definition clarity.' },
                    { id: 4, title: 'Atmospheric Glow', desc: 'Subtle environmental depth.' }
                  ].map((item) => (
                    <PlaceholderImage 
                      key={item.id} 
                      className="aspect-square w-full shadow-sm" 
                      imageUrl={`https://res.cloudinary.com/dnmj4altq/image/upload/f_auto,q_auto:best,fl_progressive:steep,dpr_auto,c_scale,w_500/reframe/showcase/ai-gen-${item.id}.jpg`}
                      alt={item.title}
                    />
                  ))}
                </div>
              </motion.div>
 
              {/* Human Editors */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: 0.1 }}
                className="space-y-5"
              >
                <div className="flex items-center justify-between border-b border-black/[0.18] pb-4">
                  <h3 className="font-heading font-bold text-[18px] md:text-[20px] tracking-tight text-text-primary flex items-center gap-3">
                    <UserCheck size={22} className="text-semantic-success" /> After Human Editors Retouching
                  </h3>
                  <span className="text-14 font-bold text-semantic-error flex items-center gap-1.5 uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-semantic-error opacity-50" />
                    6 hour
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-5">
                  <PlaceholderImage 
                    className="aspect-square w-full shadow-sm bg-white rounded-xl"
                    imageUrl="https://res.cloudinary.com/dnmj4altq/image/upload/f_auto,q_auto/reframe/showcase/ai-product-photography-original-photo.jpg"
                    alt="Original Product Photo"
                  />
                  {[1, 2, 4, 3].map((i) => (
                    <PlaceholderImage 
                      key={i} 
                      className="aspect-square w-full shadow-sm bg-white rounded-xl"
                      imageUrl={`https://res.cloudinary.com/dnmj4altq/image/upload/f_auto,q_auto/reframe/showcase/ai-product-photography-retouched-variant-${i}.jpg`}
                      alt={`Professional AI Product Photography Retouched Variant ${i}`}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Videography Showcase */}
        <div className="space-y-16 pt-20 border-t border-black/[0.18]">
          <div className="text-center">
            <h2 className={cx(typography.displayLg, "text-text-primary")}>
              Cinematic motion.<br />
              <span className="text-black/40">From a single frame.</span>
            </h2>
          </div>

          <div className="flex flex-col items-center gap-16 max-w-5xl mx-auto">
            {/* Top: Your Photo */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="flex flex-col gap-5 items-center w-full max-w-[340px]"
            >
              <h3 className="font-heading font-bold text-[18px] md:text-[20px] tracking-tight text-black/60 flex items-center gap-3">
                <Camera size={20} className="opacity-50" /> Your photo
              </h3>
              <PlaceholderImage className="w-full aspect-[4/5] shadow-sm rounded-xl" label="Original Product" />
              <button 
                onClick={handleOrder}
                className="w-full bg-text-primary text-white py-4 px-6 rounded-xl font-heading font-bold text-14 tracking-tight hover:bg-black transition-all duration-300 flex items-center justify-center gap-2 group mt-2"
              >
                <Upload size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                Upload yours
              </button>
            </motion.div>

            {/* Bottom: Videography */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.1 }}
              className="w-full flex flex-col gap-5 items-center"
            >
              <h3 className="font-heading font-bold text-[18px] md:text-[20px] tracking-tight text-text-primary flex items-center gap-3">
                <Video size={20} className="text-brand" /> Our AI Product Videography service
              </h3>
              <div className="w-full aspect-video rounded-xl shadow-lg bg-white border border-black/[0.18] overflow-hidden relative">
                <video 
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  <source src="https://res.cloudinary.com/dnmj4altq/video/upload/q_auto/reframe/showcase/ai-product-video.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </motion.div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default AIProductShowcase;
