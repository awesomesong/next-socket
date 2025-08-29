import { Skeleton } from "@heroui/react"

const PostSkeleton = () => {
    return (
        <div className="
            flex 
            flex-col
            gap-2
        " >
            <div className="flex flex-row justify-end gap-3 mb-2">
                <Skeleton className="w-[60px] h-10 rounded-md" />
                <Skeleton className="w-[60px] h-10 rounded-md" />
                <Skeleton className="w-[60px] h-10 rounded-md" />
            </div>
            <div className="flex flex-row items-center gap-3">
                <Skeleton className="w-[70px] h-[30px] rounded-full" />
                <Skeleton className="w-1/3 h-5 rounded-md" />
            </div>
            <div className="flex flex-row items-center gap-3">
                <Skeleton className="w-[30px] h-[30px] rounded-full" />
                <Skeleton className="w-1/6 h-4 rounded-lg" />
                <Skeleton className="w-1/12 h-4 rounded-lg" />
                <Skeleton className="w-1/12 h-4 rounded-lg" />
            </div>
            <div className="space-y-3 my-3">
                <Skeleton className="w-full h-6 rounded-lg" />
                <Skeleton className="w-2/5 h-6 rounded-lg" />
            </div>
            <div className="space-y-2">
                <Skeleton className="w-11/12 h-5 rounded-lg" />
                <Skeleton className="w-6/12 h-5 rounded-lg" />
                <Skeleton className="w-7/12 h-5 rounded-lg" />
                <Skeleton className="w-8/12 h-5 rounded-lg" />
                <Skeleton className="w-5/12 h-5 rounded-lg" />
            </div>
            <Skeleton className="w-full h-[42px] rounded-lg my-7" />
            <Skeleton className="w-14 h-6 rounded-lg" />
            <div className="flex flex-row items-center gap-3">
                <Skeleton className="w-[30px] h-[30px] rounded-full" />
                <Skeleton className="w-2/12 h-4 rounded-lg" />
                <Skeleton className="w-1/12 h-4 rounded-lg" />
            </div>
            <Skeleton className="w-11/12 h-5 rounded-lg" />
            <Skeleton className="w-9/12 h-5 rounded-lg" />
            <Skeleton className="w-6/12 h-5 rounded-lg" />
        </div>
    )
}

export default PostSkeleton;
