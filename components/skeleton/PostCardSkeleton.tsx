import {Card, Skeleton} from "@nextui-org/react";
import ShapesSkeleton from "./ShapesSkeleton";

const PostCardSkeleton = () => {
  return (
    <Card className="w-full space-y-2 p-4" radius="lg">
      <span className="inline-flex justify-between">
        <ShapesSkeleton width="24px" height="24px" radius="sm" />
        <ShapesSkeleton width="24px" height="24px" radius="sm" />
      </span>
      <Skeleton className="rounded-lg">
        <div className="h-60 
                        max-[320px]:h-48
                        bg-default-300
        ">
        </div>
      </Skeleton>
      <div className="space-y-3">
        <div className="flex flex-row items-center gap-2">
          <ShapesSkeleton width="70px" height="30px" radius="lg" />
          <Skeleton className="w-2/5 h-4 rounded-lg">
            <div className="w-full h-full rounded-lg bg-default-200"></div>
          </Skeleton>
        </div>
        <Skeleton className="w-4/6 h-5 rounded-lg">
          <div className="w-full h-full rounded-lg bg-default-200"></div>
        </Skeleton>
        <Skeleton className="w-4/5 h-3 rounded-lg">  
          <div className="w-full h-full rounded-lg bg-default-300"></div>
        </Skeleton>
        <Skeleton className="w-3/5 h-3 rounded-lg">  
          <div className="w-full h-full rounded-lg bg-default-300"></div>
        </Skeleton>
        <Skeleton className="w-4/6 h-3 rounded-lg">  
          <div className="w-full h-full rounded-lg bg-default-300"></div>
        </Skeleton>
        <div className="flex flex-row items-center gap-2">
          <ShapesSkeleton width="30px" height="30px" radius="lg" />
          <Skeleton className="w-1/5 h-4 rounded-lg">
            <div className="w-full h-full rounded-lg bg-default-200"></div>
          </Skeleton>
          <Skeleton className="w-1/5 h-4 rounded-lg">
            <div className="w-full h-full rounded-lg bg-default-200"></div>
          </Skeleton>
          <Skeleton className="w-1/5 h-4 rounded-lg">
            <div className="w-full h-full rounded-lg bg-default-200"></div>
          </Skeleton>
        </div>
      </div>
    </Card>
  )
}

export default PostCardSkeleton;
