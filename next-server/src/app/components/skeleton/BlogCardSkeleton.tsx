import CardSkeleton from "./CardSkeleton";

const BlogCardSkeleton = () => {
  return (
    <div className="
      layout-card
    ">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={`xs-${index}`} className="block">
          <CardSkeleton />
        </div>
      ))}

      {Array.from({ length: 2 }).map((_, index) => (
        <div key={`sm-${index}`} className="hidden sm:block">
          <CardSkeleton />
        </div>
      ))}

      {Array.from({ length: 5 }).map((_, index) => (
        <div key={`md-${index}`} className="hidden md:block">
          <CardSkeleton />
        </div>
      ))}

      {Array.from({ length: 3 }).map((_, index) => (
        <div key={`lg-${index}`} className="hidden lg:block">
          <CardSkeleton />
        </div>
      ))}
    </div>
  )
}

export default BlogCardSkeleton;
