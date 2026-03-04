'use client';

type Props = {
    /** 에러 객체 (Error 인스턴스면 message 사용) */
    error?: Error | null;
    /** error가 없을 때 보여줄 문구 */
    fallbackMessage?: string;
    /** 래퍼 최소 높이 (기본: min-h-[400px]) */
    minHeight?: string;
    className?: string;
};

const DEFAULT_FALLBACK = '데이터를 가져오는데 실패했습니다.';

export default function StatusMessage({
    error,
    fallbackMessage = DEFAULT_FALLBACK,
    minHeight = 'min-h-[200px]',
    className = '',
}: Props) {
    const message = error instanceof Error ? error.message : fallbackMessage;

    return (
        <div
            className={`flex justify-center items-center ${minHeight} ${className}`.trim()}
            role="alert"
        >
            <div className="text-stone-500 dark:text-stone-400 font-light tracking-wide text-sm">
                {message}
            </div>
        </div>
    );
}
