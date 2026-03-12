"use client";

import { Fragment } from "react";

const ChatMemberSkeleton = () => {
    const userList = Array.from({ length: 30 }).map((_, index) => (
        <Fragment key={index}>
            <div className="flex items-center gap-3 p-3 skeleton-pulse">
                <div className="shrink-0 w-8 h-8 rounded-full skeleton-bg" />
                <div className="flex-1 min-w-0">
                    <div className="w-40 h-5 rounded-lg skeleton-bg-muted-80" />
                </div>
            </div>
        </Fragment>
    ));

    return <div className="flex flex-col">{userList}</div>;
};

export default ChatMemberSkeleton;
