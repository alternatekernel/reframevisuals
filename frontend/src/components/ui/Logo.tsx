import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  showText?: boolean;
  light?: boolean;
  onClick?: () => void;
}

const Logo: React.FC<LogoProps> = ({ className = "", showText = true, light = false, onClick }) => {
  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) {
      onClick();
    }
    if (window.location.pathname === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <Link 
      to="/" 
      onClick={handleLogoClick}
      className={`flex items-center gap-2 group transition-opacity hover:opacity-90 ${className}`}
      aria-label="Reframe Visuals Home"
    >
      <div className="relative w-8 h-8 flex items-center justify-center overflow-hidden rounded-sm">
        <img 
          src="/logo.svg" 
          alt="Reframe Visuals Logo" 
          className={`w-full h-full object-contain ${light ? 'brightness-0 invert' : ''}`}
        />
      </div>
      {showText && (
        <div className="flex flex-col">
          <span 
            className="text-[16px] font-bold tracking-tight leading-none" 
            style={{ 
              fontFamily: 'var(--font-heading)', 
              color: light ? '#FFFFFF' : '#171717' 
            }}
          >
            REFRAME
          </span>
          <span 
            className="text-[10px] font-medium tracking-[0.2em] leading-none overflow-hidden transition-all duration-300 max-h-0 opacity-0 group-hover:max-h-4 group-hover:opacity-50 group-hover:mt-1" 
            style={{ 
              fontFamily: 'var(--font-heading)', 
              color: light ? '#FFFFFF' : '#171717' 
            }}
          >
            VISUALS
          </span>
        </div>
      )}
    </Link>
  );
};

export default Logo;
