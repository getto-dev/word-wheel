/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { ReactNode } from "react";

interface WinModalProps {
  children: ReactNode;
  className?: string;
}

const WinModal = ({ children, className = "" }: WinModalProps) => {
  return (
    <div
      className={`absolute inset-0 bg-black/60 flex items-end md:items-center justify-center z-50 backdrop-blur-sm w-full h-full ${className}`}
    >
      <div className="bg-white rounded-t-2xl md:rounded-[20px] 
        w-full md:w-auto md:max-w-[430px]
        px-6 pt-4 pb-[calc(16px+env(safe-area-inset-bottom,0px))] 
        md:px-[40px] md:py-[50px]
        flex flex-col items-center text-center shadow-2xl 
        animate-[slideInUp_0.3s_ease-out] gap-5 md:gap-[40px]">
        {/* Drag handle mobile */}
        <div className="w-8 h-1 rounded-full bg-black/15 md:hidden" />
        {children}
      </div>
    </div>
  );
};

export default WinModal;
