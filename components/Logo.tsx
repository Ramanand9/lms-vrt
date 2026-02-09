
import React from 'react';

interface LogoProps {
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Logo: React.FC<LogoProps> = ({ className = '', showTagline = true, size = 'md' }) => {
  const sizes = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-24',
    xl: 'h-32'
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className={`flex items-center gap-3 ${sizes[size]}`}>
        {/* Gear Graphic Container */}
        <svg viewBox="0 0 100 100" className="h-full w-auto flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Rounded Triangular Frame */}
          <path 
            d="M50 5 Q 95 30 85 80 Q 50 95 15 80 Q 5 30 50 5 Z" 
            stroke="#EA0027" 
            strokeWidth="3" 
            fill="white"
          />
          {/* Three Interlocking Gears (Abstracted) */}
          <g fill="#EA0027">
            {/* Top Gear */}
            <circle cx="50" cy="35" r="12" />
            <path d="M50 20 L50 15 M57.5 22.5 L61 19 M65 35 L70 35 M57.5 47.5 L61 51 M50 50 L50 55 M42.5 47.5 L39 51 M35 35 L30 35 M42.5 22.5 L39 19" stroke="#EA0027" strokeWidth="4" />
            
            {/* Bottom Left Gear */}
            <circle cx="35" cy="65" r="12" />
            <path d="M35 50 L35 45 M42.5 52.5 L46 49 M50 65 L55 65 M42.5 77.5 L46 81 M35 80 L35 85 M27.5 77.5 L24 81 M20 65 L15 65 M27.5 52.5 L24 49" stroke="#EA0027" strokeWidth="4" />

            {/* Bottom Right Gear */}
            <circle cx="65" cy="65" r="12" />
            <path d="M65 50 L65 45 M72.5 52.5 L76 49 M80 65 L85 65 M72.5 77.5 L76 81 M65 80 L65 85 M57.5 77.5 L54 81 M50 65 L45 65 M57.5 52.5 L54 49" stroke="#EA0027" strokeWidth="4" />
          </g>
          <circle cx="50" cy="35" r="6" fill="white" />
          <circle cx="35" cy="65" r="6" fill="white" />
          <circle cx="65" cy="65" r="6" fill="white" />
        </svg>

        {/* Text Part */}
        <div className="flex flex-col">
          <span className="text-nitrocrimson-600 font-serif font-black leading-none" style={{ fontSize: size === 'xl' ? '4rem' : size === 'lg' ? '3rem' : '2rem' }}>
            VRT
          </span>
          {size !== 'sm' && (
            <span className="text-slate-600 font-bold uppercase tracking-tight -mt-1" style={{ fontSize: size === 'xl' ? '1.5rem' : size === 'lg' ? '1.2rem' : '0.8rem' }}>
              Management Group
            </span>
          )}
        </div>
      </div>
      
      {showTagline && (
        <div className="mt-2 flex items-center gap-2 text-nitrocrimson-600 font-bold tracking-widest uppercase border-t border-nitrocrimson-600 pt-1" style={{ fontSize: size === 'xl' ? '1rem' : '0.6rem' }}>
          <span>Inspire</span>
          <span className="h-1 w-1 bg-nitrocrimson-600 rounded-full"></span>
          <span>Action</span>
          <span className="h-1 w-1 bg-nitrocrimson-600 rounded-full"></span>
          <span>Growth</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
