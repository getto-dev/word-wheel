/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { useCallback, useEffect, useRef } from "react";
import { getPath } from '../../utils/path.ts'

const InfoDialog: React.FC<{
  title: string;
  goal: string;
  goalNote?: string;
  onClose?: () => void;
}> = ({ title, goal, goalNote, onClose = () => {} } ) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

   useEffect(() => {
    if (dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, []);

  const dismissInfoDialog = useCallback(() => {
    dialogRef.current?.close();
    onClose();
  }, [onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleBackdropClick = (e: MouseEvent) => {
      const rect = dialog.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      ) {
        dismissInfoDialog();
      }
    };
    
    dialog.addEventListener("click", handleBackdropClick);
    return () => {
      dialog.removeEventListener("click", handleBackdropClick);
    };
  }, [dismissInfoDialog]);

  return (
    <dialog
      ref={dialogRef}
      className="p-0 border-none bg-transparent backdrop:bg-black/50 focus:outline-none
        /* Mobile: bottom sheet */
        fixed bottom-0 left-0 right-0 
        w-full max-w-full 
        rounded-t-2xl md:rounded-2xl
        max-h-[70dvh] md:max-h-[80dvh]
        /* Desktop: centered card */
        md:mt-auto md:ml-auto md:mr-auto md:mb-auto
        md:w-[calc(100vw-48px)] md:max-w-[400px]
        md:bottom-auto"
    >
      <div className="flex flex-col overflow-hidden relative bg-white rounded-t-2xl md:rounded-2xl">
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-8 h-1 rounded-full bg-black/15" />
        </div>

        {/* Close button */}
        <button 
          aria-label="закрыть диалог" 
          onClick={() => dismissInfoDialog()} 
          className="absolute top-3 right-3 md:top-4 md:right-4 w-8 h-8 md:w-[44px] md:h-[44px] text-black/60 hover:text-black flex items-center justify-center z-10 rounded-full hover:bg-black/5 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
            <path
              d="M6.0294 18L5 16.9706L10.4706 11.5L5 6.0294L6.0294 5L11.5 10.4706L16.9706 5L18 6.0294L12.5294 11.5L18 16.9706L16.9706 18L11.5 12.5294L6.0294 18Z"
              fill="currentColor"
            />
          </svg>
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center px-5 pb-6 pt-2 md:px-6 md:pb-8 md:pt-4">
          {/* Decorative icon (desktop only) */}
          <div className="hidden md:flex mb-3">
            <img
              src={getPath('/images/builds/info-icon.png')}
              className="w-[80px] h-[80px] select-none pointer-events-none"
              alt=""
            />
          </div>

          <p className="font-bold tracking-tight text-[17px] md:text-[18px] text-black mb-2">
            {title}
          </p>
          <p className="text-black/70 font-medium text-center text-[15px] md:text-[17px] leading-[1.5] tracking-tight">
            {goal}
          </p>
          {goalNote && (
            <p className="font-medium tracking-tight text-[13px] md:text-[15px] text-[#9BA0A6] mt-3">
              {goalNote}
            </p>
          )}
        </div>

        {/* Safe area padding for bottom sheet */}
        <div className="h-[env(safe-area-inset-bottom,0px)] md:h-0" />
      </div>
    </dialog>
  )
}

export default InfoDialog;
