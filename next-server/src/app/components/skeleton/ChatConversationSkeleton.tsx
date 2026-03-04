"use client";

import { Fragment } from "react";

const ChatConversationSkeleton = () => {
    const userList = Array.from({ length: 30 }).map((_, index) => (
        <Fragment key={index}>
            <div className="flex items-center gap-3 h-[68px] p-3 skeleton-pulse">
                <div className="shrink-0 w-10 h-10 rounded-full skeleton-bg" />
                <div className="flex flex-col gap-2 min-w-0">
                    <div className="w-[130px] xs:w-40 h-3 rounded-lg skeleton-bg" />
                    <div className="w-40 xs:w-60 h-3 rounded-lg skeleton-bg-muted-80" />
                </div>
            </div>
        </Fragment>
    ));

    return <div className="fixed top-[63px] -z-10">{userList}</div>;
};

export default ChatConversationSkeleton;
