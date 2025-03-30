import {Card, Skeleton} from "@nextui-org/react";
import { Fragment } from "react";

const ProfileModalSkeleton = () => {
    
    return (
        <div className="flex max-sm:flex-col items-center gap-4 p-3">
            <div className="flex max-sm:justify-center">
                <Skeleton className="rounded-full w-40 h-40"/>
            </div>
            <div className="flex flex-col gap-3 w-60">
                <Skeleton className="flex w-4/5 h-5 rounded-lg"/>
                <Skeleton className="flex w-3/5 h-5 rounded-lg"/>
                <Skeleton className="flex w-2/5 h-5 rounded-lg"/>
                <Skeleton className="flex w-3/5 h-5 rounded-lg"/>
                <Skeleton className="flex w-4/5 h-5 rounded-lg"/>
                <Skeleton className="flex w-3/5 h-5 rounded-lg"/>
            </div>
        </div>
    )
}

export default ProfileModalSkeleton;
