import { Fragment } from "react";
import PostCardSkeleton from "./PostCardSkeleton";

const PostPreviewSkeleton = () => {
    return (
        <div className="
            layout-card--post
        ">
            {Array.from({ length: 2 }).map((_, index) => (
                <Fragment key={`xs-${index}`}>
                    <div className="block">
                        <PostCardSkeleton />
                    </div>
                </Fragment>
            ))}
            {Array.from({ length: 2 }).map((_, index) => (
                <Fragment key={`sm-${index}`}>
                    <div className="block sm:block">
                        <PostCardSkeleton />
                    </div>
                </Fragment>
            ))}
            {Array.from({ length: 5 }).map((_, index) => (
                <Fragment key={`md-${index}`}>
                    <div className="block md:block">
                        <PostCardSkeleton />
                    </div>
                </Fragment>
            ))}
            {Array.from({ length: 3 }).map((_, index) => (
                <Fragment key={`lg-${index}`}>
                    <div className="block lg:block">
                        <PostCardSkeleton />
                    </div>
                </Fragment>
            ))}
        </div>
    )
}

export default PostPreviewSkeleton
