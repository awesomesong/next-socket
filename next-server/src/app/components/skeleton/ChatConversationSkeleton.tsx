import {Skeleton} from "@heroui/react";
import { Fragment } from "react";

const ChatConversationSkeleton = () => {
    const userList = Array.from({ length: 30 }).map((_, index) => (
        <Fragment key={index}>
            <div className="flex items-center gap-3 h-[68px] p-3">
                <div>
                    <Skeleton className="flex rounded-full w-10 h-10" />
                </div>
                <div className="flex flex-col gap-2">
                    <Skeleton className="flex w-[130px] xs:w-40 h-3 rounded-lg" />
                    <Skeleton className="flex w-40 xs:w-60 h-3 rounded-lg" />
                </div>
            </div>
        </Fragment>
    ));
    
    return (
        <div className="fixed top-[63px] -z-10">
            {userList}
        </div>
    )
}

export default ChatConversationSkeleton;
