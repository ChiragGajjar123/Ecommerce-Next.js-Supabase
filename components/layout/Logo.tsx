import React from 'react';

interface LogoProps {
  className?: string;
}

export function Logo({ className = "h-8" }: LogoProps) {
  return (
    <div className={`flex items-center select-none ${className}`}>
      {/* Custom high-end SVG logo drawing the exact luxury thick monogram letters */}
      <svg
        viewBox="0 0 150 60"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto shrink-0"
      >
        <defs>
          {/* Metallic gold gradient matching the favicon */}
          <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#bf953f" />
            <stop offset="25%" stopColor="#fcf6ba" />
            <stop offset="50%" stopColor="#b38728" />
            <stop offset="75%" stopColor="#fbf5b7" />
            <stop offset="100%" stopColor="#aa771c" />
          </linearGradient>
        </defs>
        
        {/* Letter C: Thick circular arc overlapping the M */}
        <path
          d="M 41 15 A 19 19 0 1 0 41 45"
          stroke="url(#gold-gradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Letter M: Stylized geometric V-dip overlapping C and G */}
        <path
          d="M 48 45 L 48 15 L 65 45 L 82 15 L 82 45"
          stroke="url(#gold-gradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Letter G: Circle merged with the M, plus internal crossbar */}
        <circle
          cx="103"
          cy="30"
          r="19"
          stroke="url(#gold-gradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 122 30 L 108 30"
          stroke="url(#gold-gradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
