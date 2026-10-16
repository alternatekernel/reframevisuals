import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useModal } from '../context/ModalContext';
import { Menu, X, ChevronDown, ChevronRight, ArrowRight, Mail, UserCircle, LogOut, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useContent } from '../context/ContentBase';
import { useServicesContext } from '../context/ServicesContext';
import { SERVICES } from '../data/services';
import Logo from './ui/Logo';
import { Button } from './ui/button';
import { cx } from '../utils/theme';

const NAV_ITEMS = [
  { label: 'Services', path: '/services', hasDropdown: true },
  { label: 'Pricing', path: '/pricing' },
  { label: 'Portfolio', path: '/portfolio' },
  { label: 'About', path: '/about' },
  { label: 'Blog', path: '/blog' },
  { label: 'Contact', path: '/contact' },
];

interface NavigationProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const Navigation: React.FC<NavigationProps> = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { showAlert } = useModal();
  const { isUserAuthenticated, currentUser, userLogout } = useContent();
  const { services: dbServices } = useServicesContext();
  const [servicesOpen, setServicesOpen] = useState(false);
  const [showContactPopover, setShowContactPopover] = useState(false);
  const [isHiddenBySection, setIsHiddenBySection] = useState(false);
  const [isHoveringTop, setIsHoveringTop] = useState(false);
  const [contactEmail, setContactEmail] = useState('');
  const [isContactSubmitted, setIsContactSubmitted] = useState(false);
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const popoverRef = React.useRef<HTMLDivElement>(null);
  const profileRef = React.useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowContactPopover(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayServices = dbServices.length > 0 ? dbServices : SERVICES;
  const [dropdownHovered, setDropdownHovered] = useState(false);
  const closeTimeoutRef = React.useRef<number | null>(null);

  const handleServicesMouseEnter = () => {
    if (location.pathname !== '/services') {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      setServicesOpen(true);
    }
  };

  const handleServicesMouseLeave = () => {
    if (!dropdownHovered) {
      closeTimeoutRef.current = window.setTimeout(() => {
        setServicesOpen(false);
      }, 100);
    }
  };

  const handleDropdownMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    setDropdownHovered(true);
    setServicesOpen(true);
  };

  const handleDropdownMouseLeave = () => {
    setDropdownHovered(false);
    closeTimeoutRef.current = window.setTimeout(() => {
      setServicesOpen(false);
    }, 100);
  };
  
  const isActive = (path: string) => location.pathname === path;
  
  // Hide top nav on platform pages
  const isPlatformPage = location.pathname.startsWith('/dashboard') || 
    location.pathname.startsWith('/account') || 
    location.pathname.startsWith('/jobs');
  const isLoginPage = location.pathname === '/login';
  const isSignupPage = location.pathname === '/signup';

  // Strict section tracking for Navigation hiding
  const rafId = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (location.pathname !== '/') {
      const timer = window.setTimeout(() => setIsHiddenBySection(false), 0);
      return () => window.clearTimeout(timer);
    }

    const checkSection = () => {
      const gridSection = document.getElementById('image-grid');
      if (!gridSection) return;

      const rect = gridSection.getBoundingClientRect();
      
      // HIDE: Strictly when Services section has exited (grid top <= 0)
      // REVEAL: When Grid bottom reaches the header area (grid bottom < 64)
      const shouldHide = rect.top <= 0 && rect.bottom >= 64;
      
      setIsHiddenBySection(shouldHide);
    };

    const handleScroll = () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(checkSection);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    checkSection(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [location.pathname]);

  const mouseRafId = React.useRef<number | null>(null);

  // Track mouse at top edge
  React.useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (mouseRafId.current) cancelAnimationFrame(mouseRafId.current);
      
      mouseRafId.current = requestAnimationFrame(() => {
        // If mouse is within top 30px, reveal the bar
        if (e.clientY <= 30) {
          setIsHoveringTop(true);
        } else if (e.clientY > 120) {
          // More buffer before hiding again
          setIsHoveringTop(false);
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (mouseRafId.current) cancelAnimationFrame(mouseRafId.current);
    };
  }, []);

  if (isPlatformPage) return null;

  const showNav = !isHiddenBySection || isHoveringTop;

  return (
    <>
      <motion.nav 
        initial={false}
        animate={{ 
          y: showNav ? 0 : -64,
          opacity: showNav ? 1 : 0
        }}
        transition={{ 
          duration: 1.0, 
          ease: [0.22, 1, 0.36, 1] // Slightly more "weighted" easing
        }}
        className="fixed top-0 left-0 right-0 z-[200] bg-white py-1 lg:py-2" 
        role="navigation" 
        aria-label="Main navigation"
      >
        <div className="relative w-full px-5 sm:px-6 lg:px-10 xl:px-12 h-[64px] flex items-center justify-between">
          {/* Logo */}
          <div className="relative z-10 h-[64px] flex items-center">
            <Logo />
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center h-[52px] gap-8 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -mt-1">
            {NAV_ITEMS.map((item) => (
              <div key={item.path} className="relative">
                {item.hasDropdown ? (
                  <div 
                    className="relative h-full"
                    onMouseEnter={handleServicesMouseEnter}
                    onMouseLeave={handleServicesMouseLeave}
                  >
                    <Link
                      to={item.path}
                      className={cx(
                        "flex items-center gap-1 h-full text-[16px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded",
                        isActive(item.path) ? "text-text-primary" : "text-black/60 hover:text-black"
                      )}
                    >
                      {item.label}
                      <ChevronDown size={14} aria-hidden="true" className={cx("transition-transform duration-200", servicesOpen && location.pathname !== '/services' ? "rotate-180" : "")} />
                    </Link>

                  </div>
                ) : (
                  <Link
                    to={item.path}
                    className={cx(
                      "h-full flex items-center text-[16px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded",
                      isActive(item.path) ? "text-text-primary" : "text-black/60 hover:text-black"
                    )}
                    aria-current={isActive(item.path) ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
            {servicesOpen && location.pathname !== '/services' && (
              <div 
                className="fixed inset-0 -z-10"
                onClick={() => setServicesOpen(false)}
                onMouseEnter={() => setServicesOpen(false)}
              />
            )}
          </div>

          {/* Services Mega Menu - outside transformed container */}
          <AnimatePresence>
            {servicesOpen && location.pathname !== '/services' && (
              <motion.div 
                initial={{ opacity: 0, y: 8, scale: 0.98, x: "-50%" }}
                animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                exit={{ opacity: 0, y: 4, scale: 0.98, x: "-50%" }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="fixed left-1/2 top-[56px] pt-2 z-[250]"
                onMouseEnter={handleDropdownMouseEnter}
                onMouseLeave={handleDropdownMouseLeave}
                role="menu"
                aria-label="Services menu"
              >
                <div className="bg-white rounded-[20px] p-5 grid grid-cols-3 gap-x-6 gap-y-0.5 w-[960px] max-w-[95vw] border border-black/10 shadow-[0_24px_80px_-15px_rgba(0,0,0,0.12)]">
                  {displayServices.map((svc: any) => {
                    const Icon = svc.icon;
                    return (
                      <Link
                        key={svc.id}
                        to={`/services/${svc.id}`}
                        onClick={() => setServicesOpen(false)}
                        className="group flex items-center gap-3 py-2 px-3 hover:bg-[#F8F9FA] rounded-xl transition-colors"
                        role="menuitem"
                        tabIndex={-1}
                      >
                        {Icon && (
                          <div className="flex shrink-0 items-center justify-center text-black/60 transition-all group-hover:text-black group-hover:scale-110">
                            <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                          </div>
                        )}
                        <span className="text-[15px] font-semibold text-black/80 transition-colors group-hover:text-black">
                          {svc.name}
                        </span>
                      </Link>
                    );
                  })}
                  <div className="col-span-3 border-t border-black/5 mt-3 pt-3">
                    <Link 
                      to="/services" 
                      onClick={() => setServicesOpen(false)} 
                      className="group flex items-center justify-between py-2 px-3 text-[15px] font-bold text-black/80 hover:text-black hover:bg-[#F8F9FA] rounded-xl transition-all" 
                      role="menuitem" 
                      tabIndex={-1}
                    >
                      Explore all services
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black/5 transition-all group-hover:bg-black group-hover:text-white">
                        <ArrowRight size={12} aria-hidden="true" className="transition-transform duration-300 group-hover:-rotate-45" />
                      </span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA + Mobile Menu */}
          <div className="relative z-10 flex items-center gap-2.5 pr-0 sm:gap-3 sm:pr-2">
            <div className="relative" ref={popoverRef}>
              <button
                onClick={() => setShowContactPopover(!showContactPopover)}
                className="hidden sm:flex items-center justify-center h-10 w-10 shrink-0 rounded-full border border-black/15 hover:bg-black/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 touch-manipulation"
                title="Contact us"
                aria-label="Contact us"
              >
                <Mail size={16} style={{ color: '#171717' }} aria-hidden="true" />
              </button>

              <AnimatePresence>
                {showContactPopover && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0 mt-3 w-72 bg-white/90 backdrop-blur-xl border border-black/5 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-[300]"
                  >
                    {!isContactSubmitted ? (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <h3 className="text-[14px] font-bold text-[#171717]">Quick Contact</h3>
                          <p className="text-[12px] text-[#666] font-medium leading-relaxed">
                            Leave your email and we'll reach out, or contact us directly.
                          </p>
                        </div>

                        <div className="space-y-3">
                          <div className="space-y-2">
                            <div className="relative">
                              <input
                                type="email"
                                placeholder="Your email address"
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                                disabled={isSubmittingContact}
                                className="w-full min-h-11 px-3 bg-white/50 border border-black/10 rounded-xl text-[12px] font-medium text-[#171717] outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder-[#999] focus:border-black/35 focus:bg-white focus:ring-1 focus:ring-black/5 disabled:opacity-50"
                              />
                            </div>
                            <p className="text-[12px] text-[#999] px-1 italic">
                              * No spam or annoying sales messages, guaranteed.
                            </p>
                          </div>

                          <button
                            disabled={isSubmittingContact}
                            onClick={async () => {
                              if (contactEmail.includes('@')) {
                                setIsSubmittingContact(true);
                                try {
                                  await fetch('/api/portal/inquiry', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ email: contactEmail }),
                                  });
                                  
                                  setIsContactSubmitted(true);
                                  // Reset after 5 seconds to show success
                                  setTimeout(() => {
                                    setIsContactSubmitted(false);
                                    setContactEmail('');
                                    setShowContactPopover(false);
                                    setIsSubmittingContact(false);
                                  }, 5000);
                                } catch (error) {
                                  console.error('Failed to submit inquiry:', error);
                                  showAlert({
                                    title: 'Submission Error',
                                    message: 'Something went wrong. Please try emailing us directly.',
                                    variant: 'danger'
                                  });
                                  setIsSubmittingContact(false);
                                }
                              } else {
                                showAlert({
                                  title: 'Invalid Email',
                                  message: 'Please enter a valid email address.',
                                  variant: 'warning'
                                });
                              }
                            }}
                            className="w-full min-h-11 bg-[#1F1F1F] text-white text-[12px] font-bold rounded-xl hover:bg-black transition-all flex items-center justify-center disabled:bg-[#666] touch-manipulation"
                          >
                            {isSubmittingContact ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : 'Contact Me'}
                          </button>

                          <div className="relative py-1">
                            <div className="absolute inset-0 flex items-center">
                              <div className="w-full border-t border-black/5"></div>
                            </div>
                            <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-bold text-[#999]">
                              <span className="bg-white/0 px-2 backdrop-blur-xl">or</span>
                            </div>
                          </div>

                          <a
                            href="mailto:hello@reframevisuals.com"
                            className="flex items-center justify-center gap-2 w-full min-h-11 border border-black/10 rounded-xl text-[12px] font-bold text-[#171717] hover:bg-black/5 transition-all touch-manipulation"
                          >
                            <Mail size={14} />
                            Email hello@reframevisuals.com
                          </a>
                        </div>
                      </div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="py-6 flex flex-col items-center justify-center text-center space-y-3"
                      >
                        <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center">
                          <ArrowRight size={20} className="text-[#171717]" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-[14px] font-bold text-[#171717]">Message Received</h3>
                          <p className="text-[11px] text-[#666] font-medium">We'll reach out within 5 minutes.</p>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {!isUserAuthenticated && (
              <Button
                onClick={() => navigate('/login')}
                variant="default"
                size="h10"
                className="hidden sm:flex touch-manipulation font-semibold"
                aria-label="Sign in"
              >
                Sign In
              </Button>
            )}
            {isUserAuthenticated ? (
              <div ref={profileRef} className="relative hidden sm:block">
                <button
                  onClick={() => setProfileOpen((open) => !open)}
                  className="flex h-10 w-10 items-center justify-center rounded-full overflow-hidden bg-[#1F1F1F] text-white transition-colors hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 touch-manipulation"
                  aria-label="Open customer profile"
                  aria-expanded={profileOpen}
                >
                  {currentUser?.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt={currentUser.name || 'Profile'} className="h-full w-full object-cover" />
                  ) : (
                    <UserCircle size={20} />
                  )}
                </button>
                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="absolute right-0 top-12 z-[260] w-72 rounded-2xl border border-black/10 bg-white p-3 text-left shadow-2xl"
                    >
                      <div className="border-b border-black/5 pb-3 flex items-center gap-3">
                        {currentUser?.avatarUrl ? (
                          <img src={currentUser.avatarUrl} alt={currentUser.name} className="h-10 w-10 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-[#1F1F1F] text-white flex items-center justify-center font-bold text-[14px] shrink-0">
                            {currentUser?.name?.[0]?.toUpperCase() || 'C'}
                          </div>
                        )}
                        <div className="min-w-0 flex-grow">
                          <div className="text-[13px] font-bold text-[#171717] truncate">{currentUser?.name || 'Customer'}</div>
                          <div className="mt-0.5 truncate text-[12px] text-[#666]">{currentUser?.email}</div>
                          {currentUser?.customerCode && <div className="mt-1 inline-flex rounded-full bg-black/[0.05] px-2 py-0.5 text-[10px] font-bold text-[#555]">{currentUser.customerCode}</div>}
                        </div>
                      </div>
                      <button onClick={() => { setProfileOpen(false); navigate('/dashboard'); }} className="mt-2 flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold text-[#333] hover:bg-black/[0.04] touch-manipulation"><Settings size={14} /> Profile / dashboard</button>
                      <button onClick={() => { setProfileOpen(false); userLogout(); }} className="flex min-h-11 w-full items-center gap-2 rounded-xl px-3 py-2 text-[13px] font-semibold text-red-600 hover:bg-red-50 touch-manipulation"><LogOut size={14} /> Sign out</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : null}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden min-h-12 min-w-12 -mr-3 p-2 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded touch-manipulation"
              style={{ color: '#666666' }}
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              <Menu size={24} aria-hidden="true" />
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-[290] bg-black/40 backdrop-blur-sm lg:hidden"
            />
            
            {/* Drawer */}
            <motion.div
              id="mobile-menu"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-full max-w-[400px] z-[300] bg-white lg:hidden flex flex-col shadow-2xl rounded-r-[28px] overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation menu"
            >
              <div className="flex items-center justify-between p-5 border-b border-black/[0.06]">
                <Logo onClick={() => setMobileMenuOpen(false)} />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="min-h-12 min-w-12 p-2 flex items-center justify-center rounded-full border border-black/10 hover:bg-black/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 touch-manipulation"
                  style={{ color: '#171717' }}
                  aria-label="Close menu"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col justify-between" role="menu">
                <div className="flex flex-col space-y-1.5">
                  {NAV_ITEMS.map((item, idx) => (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                    >
                      <Link
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cx(
                          "group flex items-center justify-between px-3 py-3 text-[16px] font-semibold focus-visible:outline-none transition-all touch-manipulation",
                          isActive(item.path) 
                            ? "bg-[var(--brand)]/10 text-[var(--brand)] rounded-full" 
                            : "text-black/70 hover:text-black border-b border-black/[0.06] rounded-none"
                        )}
                        role="menuitem"
                      >
                        <span>{item.label}</span>
                        <ChevronRight 
                          size={16} 
                          className={cx(
                            "transition-all duration-300 text-black/35 group-hover:text-black group-hover:translate-x-0.5",
                            isActive(item.path) ? "text-[var(--brand)] translate-x-0.5" : ""
                          )} 
                        />
                      </Link>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-black/[0.06] space-y-3">
                  {!isUserAuthenticated && (
                    <>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: NAV_ITEMS.length * 0.04 }}
                      >
                        <Link
                          to="/login"
                          onClick={() => setMobileMenuOpen(false)}
                          className="flex min-h-12 items-center justify-center text-[15px] font-bold rounded-full border border-black/10 text-[#171717] hover:bg-black/[0.02] active:scale-[0.98] transition-all touch-manipulation"
                          role="menuitem"
                        >
                          Sign In
                        </Link>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: (NAV_ITEMS.length + 1) * 0.04 }}
                      >
                        <button
                          onClick={() => {
                            navigate('/signup');
                            setMobileMenuOpen(false);
                          }}
                          className="flex min-h-12 w-full items-center justify-center text-[15px] font-bold rounded-full bg-[#1F1F1F] text-white hover:bg-black active:scale-[0.98] transition-all touch-manipulation"
                          role="menuitem"
                        >
                          Sign Up
                        </button>
                      </motion.div>
                    </>
                  )}
                  {isUserAuthenticated && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: NAV_ITEMS.length * 0.04 }}
                      className="rounded-2xl border border-black/10 bg-black/[0.02] p-4 text-left"
                    >
                      <div className="flex items-center gap-3 border-b border-black/5 pb-3">
                        {currentUser?.avatarUrl ? (
                          <img src={currentUser.avatarUrl} alt={currentUser.name} className="h-10 w-10 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-[#1F1F1F] text-white flex items-center justify-center font-bold text-[14px] shrink-0">
                            {currentUser?.name?.[0]?.toUpperCase() || 'C'}
                          </div>
                        )}
                        <div className="min-w-0 flex-grow">
                          <div className="text-[13px] font-bold text-[#171717] truncate">{currentUser?.name || 'Customer'}</div>
                          <div className="mt-0.5 truncate text-[12px] text-[#666]">{currentUser?.email}</div>
                          {currentUser?.customerCode && <div className="mt-1 inline-flex rounded-full bg-black/[0.06] px-2 py-0.5 text-[10px] font-bold text-[#555]">{currentUser.customerCode}</div>}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          navigate('/dashboard');
                          setMobileMenuOpen(false);
                        }}
                        className="mt-3 flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-white py-3 text-[14px] font-semibold text-[#171717] hover:bg-black/[0.02] active:scale-[0.98] transition-all touch-manipulation"
                        role="menuitem"
                      >
                        <Settings size={15} /> Profile / dashboard
                      </button>
                      <button
                        onClick={() => {
                          userLogout();
                          setMobileMenuOpen(false);
                        }}
                        className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#1F1F1F] py-3 text-[14px] font-semibold text-white hover:bg-black active:scale-[0.98] transition-all touch-manipulation"
                        role="menuitem"
                      >
                        <LogOut size={15} /> Sign out
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navigation;
