import React from 'react';

interface LogoProps {
  className?: string;
}

export function Logo({ className = "h-8" }: LogoProps) {
  return (
    <div className={`flex items-center select-none ${className}`}>
      {/* SVG rendering ONLY the golden CMG text matching favicon font and spacing */}
      <svg
        viewBox="0 0 85 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto shrink-0"
      >
        <text
          x="0"
          y="25"
          fill="#c5a880" /* Exact Gold styling from favicon */
          fontSize="24"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          letterSpacing="-0.5" /* Tight spacing style matching favicon monogram */
        >
          CMG
        </text>
      </svg>
    </div>
  );
}
