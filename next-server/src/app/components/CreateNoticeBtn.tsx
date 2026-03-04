"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { HiPlus } from "react-icons/hi";
import ShapesSkeleton from "./skeleton/ShapesSkeleton";

const CreateNoticeBtn = () => {
  const { status } = useSession();

  return (
    <div className="flex justify-center sm:justify-end">
      {status === "loading" ? (
        <ShapesSkeleton width="80px" height="30px" radius="full" />
      ) : (
        <Link
          href="/notice/create"
          className="action-btn"
        >
          <HiPlus className="w-4 h-4 shrink-0" aria-hidden />
          글쓰기
        </Link>
      )}
    </div>
  );
};

export default CreateNoticeBtn;
