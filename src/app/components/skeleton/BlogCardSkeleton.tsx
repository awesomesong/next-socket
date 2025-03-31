import { Fragment } from "react";
import CardSkeleton from "./CardSkeleton";

const BlogCardSkeleton = () => {
  return (
    <div className="
      layout-card
    ">
      {Array(2).fill(
        <div className="block">
          <CardSkeleton />
        </div>)
        .map((html, index) => (
        <Fragment key={index}>
          {html}
        </Fragment>
      ))}
      {Array(2).fill(
        <div className="hidden sm:block">
          <CardSkeleton />
        </div>)
        .map((html, index) => (
        <Fragment key={index}>
          {html}
        </Fragment>
      ))}
      {Array(5).fill(
        <div className="hidden md:block">
          <CardSkeleton />
        </div>)
        .map((html, index) => (
        <Fragment key={index}>
          {html}
        </Fragment>
      ))}
      {Array(3).fill(
        <div className="hidden lg:block">
          <CardSkeleton />
        </div>)
        .map((html, index) => (
        <Fragment key={index}>
          {html}
        </Fragment>
      ))}
    </div>
  )
}

export default BlogCardSkeleton;
