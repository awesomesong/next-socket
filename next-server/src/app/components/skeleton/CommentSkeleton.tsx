import {Skeleton} from "@heroui/react";

const CommentSkeleton = () => {
  return (
    <div className="flex items-center gap-3 w-full">
        <div>
            <Skeleton className="flex rounded-full w-10 h-10"/>
        </div>  
        <div className="flex flex-col gap-2 w-full">
            <Skeleton className="h-3 w-3/5 rounded-lg"/>
            <Skeleton className="h-3 w-4/5 rounded-lg"/>
        </div>
    </div>
  )
}

export default CommentSkeleton;
