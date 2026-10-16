import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, CreditCard, FileImage } from 'lucide-react';
import { ButtonWithIcon } from '../components/ui/button-with-icon';
import { layout } from '../utils/theme';

const JobNewReview = () => {
  const navigate = useNavigate();
  const imageCount = 24;
  const totalPrice = 84.00;

  return (
    <div className="min-h-screen pb-32 pt-32" style={{ backgroundColor: '#ffffff' }}>
      <div className={`${layout.compactShell} ${layout.sectionGutter}`}>
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left: Summary */}
          <div className="flex-1 space-y-8">
            <div>
              <h1 className="text-3xl font-black tracking-tight mb-2 font-heading uppercase" style={{ color: '#171717' }}>
                ORDER SUMMARY
              </h1>
              <p className="text-sm font-medium" style={{ color: '#666666' }}>
                Review your job details before submitting.
              </p>
            </div>

            <div 
              className="bg-white rounded-3xl shadow-md p-8 space-y-8" 
              style={{ boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px' }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <span className="text-[12px] font-black uppercase tracking-widest block mb-2" style={{ color: '#a3a3a3' }}>JOB NAME</span>
                    <p className="text-sm font-black" style={{ color: '#171717' }}>March 2026 Edit</p>
                  </div>
                  <div>
                    <span className="text-[12px] font-black uppercase tracking-widest block mb-2" style={{ color: '#a3a3a3' }}>SERVICES</span>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-[12px] font-black" style={{ color: '#171717' }}>
                        <CheckCircle2 size={14} style={{ color: '#16a34a' }} />
                        BACKGROUND REMOVAL
                      </li>
                      <li className="flex items-center gap-2 text-[12px] font-black" style={{ color: '#171717' }}>
                        <CheckCircle2 size={14} style={{ color: '#16a34a' }} />
                        COLOR CORRECTION
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <span className="text-[12px] font-black uppercase tracking-widest block mb-2" style={{ color: '#a3a3a3' }}>DELIVERY</span>
                    <p className="text-sm font-black" style={{ color: '#171717' }}>WED 26 MAR (48H)</p>
                  </div>
                  <div>
                    <span className="text-[12px] font-black uppercase tracking-widest block mb-2" style={{ color: '#a3a3a3' }}>PRICING</span>
                    <p className="text-sm font-black" style={{ color: '#171717' }}>$3.50 × {imageCount} IMAGES</p>
                    <p className="text-xl font-black mt-1" style={{ color: '#171717' }}>${totalPrice.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="pt-8 space-y-4" style={{ borderTop: '1px solid #f5f5f5' }}>
                <div 
                  className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{ backgroundColor: '#f0fdf4', border: '1px solid #dcfce7' }}
                >
                  <ShieldCheck size={20} style={{ color: '#16a34a' }} />
                  <p className="text-[12px] font-black uppercase tracking-widest" style={{ color: '#166534' }}>
                    ✓ 1 FREE REVISION PER IMAGE INCLUDED
                  </p>
                </div>
                <div 
                  className="flex items-center gap-3 p-4 rounded-2xl"
                  style={{ backgroundColor: '#f5f5f5' }}
                >
                  <CreditCard size={20} style={{ color: '#171717' }} />
                  <p className="text-[12px] font-black uppercase tracking-widest" style={{ color: '#666666' }}>
                    REVIEW FIRST, ALWAYS - ZERO RISK
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Thumbnails */}
          <div className="w-full lg:w-96 space-y-6">
            <div 
              className="bg-white rounded-3xl shadow-md p-6" 
              style={{ boxShadow: 'rgba(0,0,0,0.08) 0px 0px 0px 1px' }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black uppercase tracking-widest" style={{ color: '#171717' }}>FILES</h3>
                <span className="text-[12px] font-black uppercase tracking-widest" style={{ color: '#a3a3a3' }}>{imageCount} IMAGES</span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[...Array(16)].map((_, i) => (
                  <div 
                    key={i} 
                    className="aspect-square rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: '#fafafa', border: '1px solid #f5f5f5', color: '#d4d4d4' }}
                  >
                    <FileImage size={20} />
                  </div>
                ))}
              </div>
              {imageCount > 16 && (
                <p className="text-center text-[12px] font-black mt-4 uppercase tracking-widest" style={{ color: '#d4d4d4' }}>
                  + {imageCount - 16} MORE IMAGES
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 p-4 lg:p-6 z-50 backdrop-blur-xl"
        style={{ backgroundColor: 'rgba(255,255,255,0.8)', borderTop: '1px solid #f5f5f5' }}
      >
        <div className={`${layout.compactShell} flex items-center justify-between`}>
          <div className="hidden md:block">
            <p className="text-[12px] font-black uppercase tracking-widest mb-1" style={{ color: '#a3a3a3' }}>FINAL TOTAL</p>
            <p className="text-xl font-black" style={{ color: '#171717' }}>${totalPrice.toFixed(2)}</p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button 
              onClick={() => navigate('/jobs/new/services')}
              className="text-[12px] font-black uppercase tracking-widest transition-all px-4"
              style={{ color: '#a3a3a3' }}
            >
              BACK
            </button>
            <ButtonWithIcon
              label="SUBMIT JOB"
              className="flex-1 md:w-[220px] uppercase tracking-[0.12em] font-black text-[12px]"
              onClick={() => navigate('/dashboard')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobNewReview;
