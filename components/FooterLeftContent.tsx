/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface FooterLeftContentProps {
  levelId: number;
  totalLevels: number;
  score?: number;
  buttonDisabled?: boolean;
  button: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const FooterLeftContent: React.FC<FooterLeftContentProps> = ({ 
  levelId,
  totalLevels,
  score,
  button,
  buttonDisabled,
  soundEnabled,
  onToggleSound
}) => {
  const gradientBorderStyle: React.CSSProperties = {
    background: 'conic-gradient(from 270deg at 50% 50.12%, #4285F4 142.87deg, #BB55A1 175.78deg, #EA4335 194.23deg, #FBBC04 246.99deg, #B9D84C 268.68deg, #38A852 305.11deg, #38A852 330.36deg, #4285F4 353.77deg)'
  };
  
  const totalDisplay = totalLevels === Infinity ? '∞' : totalLevels;

  return (
    <div className="flex flex-col items-center justify-center 
      pt-1 md:pt-2
      pb-[max(12px,env(safe-area-inset-bottom))] md:pb-4 lg:pb-5
      px-3 md:px-0">
      <div 
        className="p-[1.5px] rounded-full overflow-hidden shadow-lg" 
        style={gradientBorderStyle}
      >
        <div className="bg-[#000000] rounded-full flex items-center gap-2 md:gap-3 
          px-3 md:px-4 
          h-[40px] md:h-[44px] lg:h-[48px]">
          
          {/* Score info */}
          <span className="text-white 
            text-[13px] md:text-[15px] lg:text-[16px] 
            font-medium leading-none whitespace-nowrap">
            {levelId}/{totalDisplay} · {score} очк
          </span>

          {/* Divider */}
          <div className="w-px h-4 bg-white/20" />

          {/* Hint button */}
          <button
            onClick={(e) => { e.stopPropagation(); button(); }}
            disabled={buttonDisabled}
            className="flex items-center justify-center 
              bg-[#1A1A1A] disabled:opacity-30
              hover:bg-white hover:text-black
              active:bg-white/80
              text-white 
              rounded-full 
              transition-colors duration-150
              h-[30px] md:h-[34px] lg:h-[36px]
              px-3 md:px-4"
          >
            <span className="text-[12px] md:text-[13px] lg:text-[14px] font-medium leading-none whitespace-nowrap">
              Подсказка −20
            </span>
          </button>

          {/* Divider */}
          <div className="w-px h-4 bg-white/20" />

          {/* Sound toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSound(); }}
            className="flex items-center justify-center 
              bg-[#1A1A1A] hover:bg-white hover:text-black
              active:bg-white/80
              text-white 
              rounded-full 
              transition-colors duration-150
              h-[30px] md:h-[34px] lg:h-[36px]
              w-[30px] md:w-[34px] lg:w-[36px]"
            aria-label={soundEnabled ? "Выключить звук" : "Включить звук"}
          >
            {soundEnabled ? (
              /* Speaker on icon */
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 md:w-5 md:h-5">
                <path d="M11 5L6 9H2V15H6L11 19V5Z" fill="currentColor"/>
                <path d="M15.54 8.46C16.4774 9.39764 17.004 10.6692 17.004 11.995C17.004 13.3208 16.4774 14.5924 15.54 15.53" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M19.07 4.93C20.9442 6.80528 21.9979 9.34836 21.9979 12C21.9979 14.6516 20.9442 17.1947 19.07 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            ) : (
              /* Speaker off icon */
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 md:w-5 md:h-5">
                <path d="M11 5L6 9H2V15H6L11 19V5Z" fill="currentColor"/>
                <line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Footer credit */}
      <span className="text-white/30 text-[11px] mt-1.5 font-medium tracking-wide whitespace-nowrap">
        Getto-Dev • 2026
      </span>
    </div>
  );
};

export default FooterLeftContent;
