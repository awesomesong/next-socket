import { Fragment } from "react";
import PostCardSkeleton from "./PostCardSkeleton";

const PostPreviewSkeleton = () => {
    return (
        <div className="
            layout-card--post
            fixed 
            left-0
            w-full
            mt-12
            px-2
            md:px-8
        ">
            {Array(2).fill(
                <div className="block">
                <PostCardSkeleton />
                </div>)
                .map((html, index) => (
                <Fragment key={index}>
                    {html}
                </Fragment>
            ))}
            {Array(2).fill(
                <div className="block sm:block">
                <PostCardSkeleton />
                </div>)
                .map((html, index) => (
                <Fragment key={index}>
                    {html}
                </Fragment>
            ))}
            {Array(5).fill(
                <div className="block md:block">
                <PostCardSkeleton />
                </div>)
                .map((html, index) => (
                <Fragment key={index}>
                    {html}
                </Fragment>
            ))}
            {Array(3).fill(
                <div className="block lg:block">
                <PostCardSkeleton />
                </div>)
                .map((html, index) => (
                <Fragment key={index}>
                    {html}
                </Fragment>
            ))}
        </div>
    )
}

export default PostPreviewSkeleton
