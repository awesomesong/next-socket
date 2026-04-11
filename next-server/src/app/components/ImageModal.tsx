'use client';

import Image from "next/image";
import { useEffect, useState, useCallback, useRef, useLayoutEffect } from "react";
import type { ReactNode, CSSProperties } from "react";
import clsx from "clsx";

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCALE_STEP = 0.25;

const zoomButtonClass =
    "p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none transition-all";

function ZoomIconButton({
    onClick,
    disabled,
    ariaLabel,
    children,
}: {
    onClick: () => void;
    disabled?: boolean;
    ariaLabel: string;
    children: ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={zoomButtonClass}
            aria-label={ariaLabel}
        >
            {children}
        </button>
    );
}

interface ImageModalProps {
    src: string;
    isOpen?: boolean;
    onClose: () => void;
    alt?: string;
}

const ImageModal: React.FC<ImageModalProps> = ({
    src,
    isOpen,
    onClose,
    alt = "이미지",
}) => {
    const [scale, setScale] = useState(1);
    const [baseSize, setBaseSize] = useState<{ w: number; h: number } | null>(null);
    const imageWrapRef = useRef<HTMLDivElement>(null);
    const scrollWrapRef = useRef<HTMLDivElement>(null);
    const rafIdRef = useRef<number | null>(null);
    const pendingSizeRef = useRef<{ w: number; h: number } | null>(null);
    const lastBaseSizeRef = useRef<{ w: number; h: number } | null>(null);

    // scale 1일 때 이미지 표시 크기 측정 → 확대 시 스크롤 영역 계산용
    useLayoutEffect(() => {
        if (!isOpen || scale !== 1 || !imageWrapRef.current) return;
        const el = imageWrapRef.current;

        const flush = () => {
            rafIdRef.current = null;
            const next = pendingSizeRef.current;
            if (!next || next.w <= 0 || next.h <= 0) return;
            const prev = lastBaseSizeRef.current;
            if (prev && prev.w === next.w && prev.h === next.h) return;
            lastBaseSizeRef.current = next;
            setBaseSize(next);
        };

        const scheduleFlush = (w: number, h: number) => {
            pendingSizeRef.current = { w, h };
            if (rafIdRef.current != null) return;
            rafIdRef.current = window.requestAnimationFrame(flush);
        };

        const measureNow = () => {
            const rect = el.getBoundingClientRect();
            scheduleFlush(rect.width, rect.height);
        };

        const observer = new ResizeObserver(measureNow);
        observer.observe(el);
        measureNow();

        return () => {
            observer.disconnect();
            pendingSizeRef.current = null;
            if (rafIdRef.current != null) {
                window.cancelAnimationFrame(rafIdRef.current);
                rafIdRef.current = null;
            }
        };
    }, [isOpen, scale, src]);

    useEffect(() => {
        if (!isOpen) return;
        setBaseSize(null);
        lastBaseSizeRef.current = null;
    }, [isOpen, src]);

    const zoomIn = useCallback(() => {
        setScale((s) => Math.min(MAX_SCALE, s + SCALE_STEP));
    }, []);
    const zoomOut = useCallback(() => {
        setScale((s) => Math.max(MIN_SCALE, s - SCALE_STEP));
    }, []);
    const resetZoom = useCallback(() => setScale(1), []);

    useEffect(() => {
        if (!isOpen) return;
        setScale(1);
    }, [isOpen, src]);

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

    useEffect(() => {
        if (!isOpen) return;
        const el = scrollWrapRef.current;
        if (!el) return;

        const onWheel = (e: WheelEvent) => {
            if (!e.ctrlKey && !e.metaKey) return;
            e.preventDefault();
            if (e.deltaY < 0) zoomIn();
            else zoomOut();
        };

        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel);
    }, [isOpen, zoomIn, zoomOut]);

    return (
        <div
            className={clsx(
                "fixed inset-0 z-[1000] flex flex-col transition-all duration-300",
                "bg-black/80 backdrop-blur-md",
                isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
            )}
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="이미지 확대"
        >
            {/* 상단 바: 닫기 + 확대/축소 */}
            <div
                className="flex items-center justify-end gap-2 absolute top-4 right-4 left-4 z-10"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-1 ml-auto rounded-full bg-black/40 p-1.5">
                    <ZoomIconButton
                        onClick={zoomOut}
                        disabled={scale <= MIN_SCALE}
                        ariaLabel="축소"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                    </ZoomIconButton>
                    <button
                        type="button"
                        onClick={resetZoom}
                        className="min-w-[1.875rem] px-1.5 py-0.5 text-[12px] text-white/90 font-medium"
                        aria-label="원래 크기"
                    >
                        {Math.round(scale * 100)}%
                    </button>
                    <ZoomIconButton
                        onClick={zoomIn}
                        disabled={scale >= MAX_SCALE}
                        ariaLabel="확대"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                    </ZoomIconButton>
                </div>
                <button
                    type="button"
                    className="p-3 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    aria-label="닫기"
                >
                    <span className="text-2xl leading-none">&times;</span>
                </button>
            </div>

            {/* 이미지 영역: 항상 중앙 정렬, 확대 시 중앙에서 커지며 스크롤로 전체 확인 */}
            <div
                className="flex-1 min-h-0 overflow-auto flex p-4 pt-16"
                onClick={(e) => e.stopPropagation()}
                ref={scrollWrapRef}
            >
                <div
                    className={clsx(
                        "m-auto flex items-center justify-center",
                        baseSize && scale > 1 && "w-[var(--wrap-w)] h-[var(--wrap-h)] min-w-[var(--wrap-w)] min-h-[var(--wrap-h)]"
                    )}
                    style={
                        baseSize && scale > 1
                            ? ({
                                  ["--wrap-w"]: `${baseSize.w * scale}px`,
                                  ["--wrap-h"]: `${baseSize.h * scale}px`,
                              } as CSSProperties)
                            : undefined
                    }
                >
                    <div
                        ref={imageWrapRef}
                        className={clsx(
                            "flex items-center justify-center origin-center [transform:scale(var(--scale))]",
                            baseSize && scale > 1 && "w-[var(--img-w)] h-[var(--img-h)]"
                        )}
                        style={
                            {
                                ["--scale"]: scale,
                                ...(baseSize && scale > 1
                                    ? {
                                          ["--img-w"]: `${baseSize.w}px`,
                                          ["--img-h"]: `${baseSize.h}px`,
                                      }
                                    : {}),
                            } as CSSProperties
                        }
                        onDoubleClick={resetZoom}
                    >
                        {src ? (
                            <Image
                                alt={alt}
                                src={src}
                                width={1600}
                                height={1600}
                                className={clsx(
                                    "drop-shadow-2xl pointer-events-none select-none object-contain",
                                    baseSize && scale > 1
                                        ? "w-full h-full"
                                        : "max-w-full max-h-[85vh] w-auto h-auto"
                                )}
                                sizes="100vw"
                                draggable={false}
                            />
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageModal;
