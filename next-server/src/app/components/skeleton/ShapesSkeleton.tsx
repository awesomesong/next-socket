import { Skeleton } from "@heroui/skeleton";
import { Card } from "@heroui/react";
import clsx from "clsx";

type ShapesSkeletonProps  = {
    width: string;
    height: string;
    radius: "sm" | "md" | "lg" | "none" | undefined;
}

const ShapesSkeleton = ({ width, height, radius } : ShapesSkeletonProps ) => {
    return (
        <Card radius={radius} style={{ width, height }}>
            <Skeleton style={{ width, height }}>
                <div style={{ width, height }} />
            </Skeleton>
        </Card>
    )
}

export default ShapesSkeleton
