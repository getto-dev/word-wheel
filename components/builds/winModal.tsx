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
      className={`absolute inset-0 bg-black/60 flex items-center justify-center p-3 sm:p-4 z-50 backdrop-blur-sm w-full h-full ${className}`}
    >
      <div className="bg-white rounded-[16px] sm:rounded-[20px] px-5 sm:px-[40px] py-6 sm:py-[50px] w-full max-w-[320px] sm:max-w-[430px] flex flex-col items-center text-center shadow-2xl animate-in fade-in zoom-in duration-300 gap-5 sm:gap-[40px]">
        {children}
      </div>
    </div>
  );
};

export default WinModal;
