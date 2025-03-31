import {Card, Skeleton} from "@nextui-org/react";

export const BlogSkeleton = () => {
    return (
        <Card className="w-full h-full space-y-4 p-4" radius="lg">
            <div className="space-y-3">
                <Skeleton className="w-3/5 rounded-lg">
                    <div className="h-8 w-3/5 rounded-lg bg-default-200"></div>
                </Skeleton>
                <Skeleton className="w-4/5 rounded-lg">
                    <div className="h-5 w-4/5 rounded-lg bg-default-200"></div>
                </Skeleton>
                <Skeleton className="w-2/5 rounded-lg">  
                    <div className="h-5 w-2/5 rounded-lg bg-default-300"></div>
                </Skeleton>
            </div>
            <Skeleton className="rounded-lg flex-1">
                <div className=" rounded-lg bg-default-300" />
            </Skeleton>
        </Card>
    )
}
