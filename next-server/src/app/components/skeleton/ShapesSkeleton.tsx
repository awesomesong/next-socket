"use client";

type ShapesSkeletonProps = {
    width: string;
    height: string;
    radius: "sm" | "md" | "lg" | "none" | "full" | undefined;
};

const radiusClass = {
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    full: "rounded-full",
    none: "rounded-none",
};

const ShapesSkeleton = ({ width, height, radius }: ShapesSkeletonProps) => {
    const rounded = radius ? radiusClass[radius] : "rounded-lg";
    return (
        <div
            className={`bg-[#e0d7ed] dark:bg-[#e2d9f3] animate-pulse ${rounded} overflow-hidden`}
            style={{ width, height }}
        />
    );
};

export default ShapesSkeleton;
