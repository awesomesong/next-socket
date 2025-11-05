"use client";
import ShapesSkeleton from "./skeleton/ShapesSkeleton";
import LargeButton from "./LargeButton";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const CreateBlogBtn = () => {
  const router = useRouter();
  const { status } = useSession();
  const width = "73px";
  const height = "40px";

  const onClick = () => {
    router.push(`/blogs/create`);
  };

  return (
    <>
      <div className="flex justify-end">
        {status === "loading" ? (
          <div className={`w-[${width}] h-[${height}]`}>
            <ShapesSkeleton width={width} height={height} radius="lg" />
          </div>
        ) : (
          <div>
            <LargeButton onClick={onClick}>글쓰기</LargeButton>
          </div>
        )}
      </div>
    </>
  );
};

export default CreateBlogBtn;
