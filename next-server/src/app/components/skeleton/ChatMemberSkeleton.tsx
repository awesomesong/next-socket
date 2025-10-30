import {Skeleton} from "@heroui/react";
import { Fragment } from "react";

const ChatMemberSkeleton = () => {
    const userList = Array(30).fill(
        <div className="flex items-center gap-3 p-3">
            <div>
                <Skeleton className="flex rounded-full w-8 h-8"/>
            </div>
            <div className="flex-1">
                <Skeleton className="flex w-40 h-5 rounded-lg"/>
            </div>
        </div>
    ).map((html, index) => (
            <Fragment key={index}>
              {html}
            </Fragment>
    ));
    
    return (
        <div className="fixed -z-10">
            {userList}
        </div>
    )
}

export default ChatMemberSkeleton;
