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
    // play the background music when the dialog is dismissed
    // playBackground(getPath("/media/audio/music/GiO26_Music_Loop_Final.mp3"));

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
      className="mt-auto ml-auto mr-auto mb-auto p-0 border-none rounded-2xl bg-transparent backdrop:bg-black/40 focus:outline-none
        w-[calc(100vw-32px)] max-w-[340px] sm:max-w-[400px] md:max-w-[435px]
        h-auto sm:h-[400px] md:h-[435px]
        max-h-[80dvh]"
    >
      <div className="flex h-full w-full flex-col overflow-hidden relative">
        <img
          src={getPath('/images/builds/info-icon.png')}
          className="w-[120px] h-[120px] sm:w-[188px] sm:h-[188px] absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none"
          alt="Иконка информации"
        />
        <img
          src={getPath('/images/builds/info-icon.png')}
          className="w-[120px] h-[120px] sm:w-[188px] sm:h-[188px] absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 select-none pointer-events-none"
          alt="Иконка информации"
        />
        <button aria-label="закрыть диалог" onClick={() => dismissInfoDialog()} className="absolute top-3 right-3 sm:top-4 sm:right-4 w-[44px] h-[44px] text-black flex flex-col justify-center items-center z-10">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 sm:w-6 sm:h-6">
            <path
              d="M6.0294 18L5 16.9706L10.4706 11.5L5 6.0294L6.0294 5L11.5 10.4706L16.9706 5L18 6.0294L12.5294 11.5L18 16.9706L16.9706 18L11.5 12.5294L6.0294 18Z"
              fill="currentColor"
            />
          </svg>
        </button>
        <div className="flex bg-white flex-col items-center text-balance flex-1 justify-center p-4 sm:p-[26px] py-16 sm:py-[110px] rounded-2xl">
          <p className="inline-flex font-bold tracking-[-0.36px] text-[16px] sm:text-[18px] text-black mb-2">
            {title}
          </p>
          <p className="inline-flex text-black font-medium text-center max-w-[300px] sm:max-w-[875px] text-[15px] sm:text-[18px] leading-[1.5] sm:leading-[1.6] tracking-[-0.36px]">
            {goal}
          </p>
          {goalNote && (
            <p className="inline-flex font-medium tracking-[-0.4px] text-[14px] sm:text-[16px] lg:text-[18px] text-[#9BA0A6] mt-3 sm:mt-4">
              {goalNote}
            </p>
          )}
        </div>
      </div>
    </dialog>
    )
}

export default InfoDialog;
