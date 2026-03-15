"use client";

/**
 * NoticeSkeleton
 * Loading placeholder for notice create/edit form.
 * Matches FormNotice layout (title input, editor, submit actions) and uses
 * the same skeleton colors as FragranceSkeleton (skeleton-bg, skeleton-bg-muted, etc.).
 */
export const NoticeSkeleton = () => {
    return (
        <div
            className="
              flex
              flex-col
              mx-auto
              h-full
              p-4
              skeleton-pulse
            "
        >
            {/* Title input skeleton — matches FormNotice title block (mb-4) */}
            <div className="mb-4">
                <div
                    className="w-full h-10 rounded-md skeleton-bg skeleton-border border"
                    aria-hidden
                />
            </div>

            {/* Editor area skeleton — matches #editor (flex flex-1 mb-4) */}
            <div id="editor" className="flex flex-1 mb-4 min-h-0">
                <div className="w-full flex-1 min-h-0 rounded-lg skeleton-bg-muted-70 skeleton-border border" />
            </div>

            {/* Submit actions skeleton — matches FormSubmitActions (flex flex-row gap-2 sm:gap-4) */}
            <div className="flex flex-row gap-2 sm:gap-4">
                <div className="flex-1 h-[38px] rounded-md skeleton-bg" />
                <div className="h-[38px] w-20 rounded-md skeleton-bg-muted" />
            </div>
        </div>
    );
};
