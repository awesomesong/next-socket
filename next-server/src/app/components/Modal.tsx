'use client';
import { IoClose } from "react-icons/io5";
import clsx from "clsx";
import { ModalProps } from "@/src/app/types/common";
import useIsMobileDevice from "../hooks/useIsMobileDevice";
import { useEffect } from "react";

const Modal:React.FC<ModalProps> = ({
    isOpen,
    onCloseModal,
    children,
}) => {
    const isMobileDevice = useIsMobileDevice();

    useEffect(() => {
        if (!isOpen) return;
      
        const onKey = (e: KeyboardEvent) => {
          if (e.key === "Escape") onCloseModal();
        };
        window.addEventListener("keydown", onKey);
      
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
      
        return () => {
          window.removeEventListener("keydown", onKey);
          document.body.style.overflow = prev;
        };
    }, [isOpen, onCloseModal]);

    return (
            <div
                className={clsx(
                    "fixed inset-0 z-50",
                    isOpen? "block" : "hidden"
                )}
                onClick={onCloseModal}
            >
                <div 
                    className={clsx(`
                            fixed
                            inset-0
                            bg-neutral-800
                            backdrop-blur-sm
                            transition-opacity
                        `,
                        isOpen? "bg-opacity-75" : "opacity-0"
                    )}
                >
                    <div className={clsx(`
                        fixed 
                        inset-0 
                        z-10 
                        overflow-y-hidden`,
                        isOpen && "effect-downUp"
                    )}
                    >
                        <div
                            className={clsx(`
                                    flex
                                    overflow-hidden
                                    h-full
                                    justify-center
                                    m-4
                                    text-center
                                    sm:p-0
                                `,
                                isMobileDevice ? "items-start" : "items-center"
                            )}
                        >
                            <div
                                className={clsx(`
                                        overflow-auto
                                        relative
                                        bg-default
                                        my-4
                                        p-4
                                        text-left
                                        shadow-xsl
                                        sm:w-full
                                        sm:max-w-lg
                                        max-sm:w-full
                                        h-auto
                                        max-h-screen
                                        sm:py-6
                                        sm:px-6
                                        rounded-lg
                                    `,
                                    isOpen && "effect-downUp"
                                )}
                                onClick={(e) => e.stopPropagation()}
                            >

                                <div
                                    className="
                                        absolute
                                        right-[2px]
                                        top-[3px]
                                        z-10
                                    "
                                >
                                    <button
                                        onClick={onCloseModal}
                                        type="button"
                                        className="
                                            rounded-md
                                            text-gray-400
                                            focus:outline-none
                                            focus:ring-2
                                            focus:ring-sky-500
                                            focus:ring-offset-2
                                        "
                                    >
                                        <span className="sr-only">닫기</span>
                                        <IoClose size={24} />
                                    </button>
                                </div>
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
    )
}

export default Modal;
