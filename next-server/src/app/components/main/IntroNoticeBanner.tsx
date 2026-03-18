'use client';

import Link from 'next/link';
import { useState } from 'react';
import { HiOutlineBookOpen } from 'react-icons/hi2';

export default function IntroNoticeBanner() {
    const [isOpen, setIsOpen] = useState(true);

    const handleClose = () => {
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <div
            className="absolute top-4 left-0 right-0 z-10 mx-auto px-4 min-[480px]:left-auto min-[480px]:right-4 min-[480px]:mx-0 min-[480px]:px-0"
            role="dialog"
            aria-modal="true"
            aria-label="Scent Memories 소개 안내"
        >
            <div className="flex items-center gap-3 rounded-lg border border-default bg-[linear-gradient(115deg,rgba(166,125,92,0.12)_0%,rgba(92,74,122,0.18)_55%,rgba(176,125,130,0.12)_100%)] backdrop-blur-xl p-3 shadow-md">
                <Link
                    href="/notice/intro"
                    className="flex min-w-0 flex-1 items-start gap-2 text-xs text-secondary hover:opacity-90 transition-opacity min-[480px]:flex-nowrap"
                >
                    <HiOutlineBookOpen className="size-4 shrink-0 text-secondary/70" aria-hidden />
                    <p className="min-w-0">Scent Memories 이용 방법은 여기서 확인하세요.</p>
                </Link>
                <button
                    type="button"
                    onClick={handleClose}
                    className="shrink-0 rounded-full p-1 text-secondary hover:bg-black/10 hover:text-fg transition-colors"
                    aria-label="닫기"
                >
                    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
