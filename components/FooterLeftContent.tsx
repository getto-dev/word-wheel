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
}

const FooterLeftContent: React.FC<FooterLeftContentProps> = ({ 
  levelId,
  totalLevels,
  score,
  button,
  buttonDisabled
}) => {
  const gradientBorderStyle = {
    background: 'conic-gradient(from 270deg at 50% 50.12%, #4285F4 142.87deg, #BB55A1 175.78deg, #EA4335 194.23deg, #FBBC04 246.99deg, #B9D84C 268.68deg, #38A852 305.11deg, #38A852 330.36deg, #4285F4 353.77deg)'
  };
  const textStyle = "text-white text-[14px] xs:text-[16px] md:text-[18px] font-medium leading-[1.2] md:leading-[1.6] md:tracking-[-0.36px] whitespace-nowrap";
  
  // Показываем ∞ для бесконечных уровней
  const totalDisplay = totalLevels === Infinity ? '∞' : totalLevels;

  return (
    <div className="flex items-center justify-center mt-2 sm:mt-[12px] lg:mt-[24px] lg:mb-[12px] px-2 sm:px-0 pb-[env(safe-area-inset-bottom,0px)]">
      <div 
        className="p-[1.5px] rounded-full overflow-hidden shadow-lg w-full max-w-[500px]" 
        style={gradientBorderStyle}
      >
        <div className="bg-[#000000] rounded-full flex flex-col xs:flex-row h-auto xs:h-[48px] px-3 xs:px-4 py-2 xs:py-0 items-center justify-center gap-2 xs:gap-[12px]">
            <span className={textStyle}>
                Уровень {levelId}/{totalDisplay} — {score} очков
            </span>

            <button
            onClick={(e) => {
                e.stopPropagation();
                button();
            }}
            disabled={buttonDisabled}
            className="flex h-[36px] xs:h-[35px] px-3 xs:px-[18px] items-center justify-center bg-[#202020] hover:bg-white text-white hover:text-black rounded-full transition-colors duration-200"
            >
            <span className="text-[13px] xs:text-[16px] md:text-[18px] font-medium leading-[1.2] md:leading-[1.6] md:tracking-[-0.36px] whitespace-nowrap">
                Подсказка (-30)
            </span>
            </button>
        </div>
      </div>
    </div>
  );
};

export default FooterLeftContent;
