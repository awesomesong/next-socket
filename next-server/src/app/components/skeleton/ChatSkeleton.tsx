import {Skeleton} from "@heroui/react";
import { Fragment } from "react";

const ChatSkeleton = () => {
    const chatList = Array(30).fill(
    <>
        <div className="flex items-center gap-3 h-[68px] mt-2 p-3">
            <div>
                <Skeleton className="flex rounded-full w-10 h-10"/>
            </div>
            <div className="flex flex-col gap-2">
                <Skeleton className="flex w-80 md:w-[500px] max-[480px]:w-60 max-[320px]:w-36 h-6 rounded-xl"/>
                <Skeleton className="flex w-[100px] xs:w-40 h-4 rounded-xl"/>
            </div>
        </div>
        <div className="flex flex-row-reverse items-center gap-3 h-[68px] mt-2 p-3">
            <div>
                <Skeleton className="flex rounded-full w-10 h-10"/>
            </div>
            <div className="flex flex-col gap-2 justify-start items-end">
                <Skeleton className="flex w-60 md:w-96 h-6 max-[320px]:w-36 rounded-xl"/>
                <Skeleton className="flex w-[100px] xs:w-40 h-4 rounded-xl"/>
            </div>
        </div>
    </>
    ).map((html, index) => (
            <Fragment key={index}>
              {html}
            </Fragment>
    ));
    
    return (
        <div className="
            fixed 
            top-[68px] 
            left-0
            lg:left-[400px]
            md:left-20
            right-0
            -z-10
        ">
            {chatList}
        </div>
    )
}

export default ChatSkeleton;
