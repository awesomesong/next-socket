'use client';
import { IoClose } from "react-icons/io5";
import clsx from "clsx";
import { ModalProps } from "@/src/app/types/common";
import { useEffect } from "react";
import { createPortal } from "react-dom";

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onCloseModal,
    children,
    title,
    footer,
}) => {
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

    const modalContent = (
        <div
            className={clsx(
                "fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-300",
                isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
            )}
        >
            {/* Backdrop */}
            <div
                className={clsx(
                    "fixed inset-0 bg-neutral-900/60 backdrop-blur-md transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0"
                )}
                onClick={onCloseModal}
            />

            {/* Modal Content Wrapper */}
            <div
                className={clsx(
                    "relative z-10 w-[calc(100%-2rem)] max-w-lg transition-all duration-300 ease-out",
                    isOpen ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-4 opacity-0"
                )}
            >
                <div
                    className={clsx(
                        "overflow-hidden relative bg-[var(--bg-page)]",
                        "border-1 border-[var(--color-lavender-border)]",
                        "shadow-2xl rounded-2xl transition-all duration-300",
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header with Title and Close Button */}
                    <div className="flex items-center justify-between px-4 pt-4 sm:px-5 sm:pt-5 pb-0">
                        {title ? (
                            <h2 className="modal-title">{title}</h2>
                        ) : (
                            <div />
                        )}
                        <button
                            onClick={onCloseModal}
                            type="button"
                            className={clsx(
                                "flex items-center justify-center p-1 sm:p-1.5 rounded-full transition-all duration-300",
                                "bg-[var(--color-lavender-pale)]/50 backdrop-blur-sm text-[var(--color-text-primary)]",
                                "hover:bg-[var(--color-lavender-light)]/80 hover:scale-110 active:scale-95",
                                "border-1 border-[var(--color-lavender-border)] shadow-sm"
                            )}
                        >
                            <span className="sr-only">닫기</span>
                            <IoClose size={20} />
                        </button>
                    </div>

                    {/* Content Section */}
                    <div className="p-5 max-h-[calc(100vh-160px)] overflow-y-auto">
                        {children}
                    </div>

                    {/* Footer Section */}
                    {footer && (
                        <div className="px-4 pt-2 pb-4">
                            {footer}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (typeof document === "undefined") return null;
    return createPortal(modalContent, document.body);
};

export default Modal;
