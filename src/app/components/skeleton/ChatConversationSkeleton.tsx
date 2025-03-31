import {Card, Skeleton} from "@nextui-org/react";
import { Fragment } from "react";

const ChatConversationSkeleton = () => {
    const userList = Array(30).fill(
        <div className="flex items-center gap-3 h-[68px] p-3">
            <div>
                <Skeleton className="flex rounded-full w-10 h-10"/>
            </div>
            <div className="flex flex-col gap-2">
                <Skeleton className="flex w-[130px] xs:w-40 h-3 rounded-lg"/>
                <Skeleton className="flex w-40 xs:w-60 h-3 rounded-lg"/>
            </div>
        </div>
    ).map((html, index) => (
            <Fragment key={index}>
              {html}
            </Fragment>
    ));
    
    return (
        <div className="fixed top-[63px]">
            {userList}
        </div>
    )
}

export default ChatConversationSkeleton;
