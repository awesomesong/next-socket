'use client';

import Image from "next/image";
import { useEffect } from "react";
import clsx from "clsx";

interface ImageModalProps {
    src: string;
    isOpen?: boolean;
    onClose: () => void;
    alt?: string;
}

const ImageModal:React.FC<ImageModalProps> = ({
    src,
    isOpen,
    onClose,
    alt = "이미지",
}) => {
    useEffect(() => {
        if (!isOpen) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);

        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, [isOpen, onClose]);

    return (
        <div
            className={clsx(
                "fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300",
                "bg-black/80 backdrop-blur-md",
                isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
            )}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="이미지 확대"
        >
            <button
                type="button"
                className="absolute top-8 right-8 z-10 p-3 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all"
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }}
                aria-label="닫기"
            >
                <span className="text-2xl leading-none">&times;</span>
            </button>
            <div
                className="relative max-w-[95vw] max-h-[95vh] w-full h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                {src ? (
                    <Image
                        alt={alt}
                        src={src}
                        width={1600}
                        height={1600}
                        unoptimized={false}
                        className="max-w-full max-h-[90vh] w-auto h-auto object-contain drop-shadow-2xl"
                        sizes="100vw"
                    />
                ) : null}
            </div>
        </div>
    );
};

export default ImageModal;
