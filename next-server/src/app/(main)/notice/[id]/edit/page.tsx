"use client";
import { FormNotice } from "@/src/app/components/FormNotice";
import { NoticeSkeleton } from "@/src/app/components/skeleton/NoticeSkeleton";
import getNotice from "@/src/app/lib/getNotice";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { use } from "react";

type IdProps = {
  id: string;
};

type ParamsProps = {
  params: Promise<IdProps>;
};

const BlogEditpage = ({ params }: ParamsProps) => {
  const { id } = use(params);

  const { data: session } = useSession();
  const { data, status } = useQuery({
    queryKey: ["noticeDetailEdit", id],
    queryFn: () => getNotice(id),
    enabled: !!session?.user?.email,
  });

  return (
    <>
      {status === 'pending'
        ? (<NoticeSkeleton />) 
        : status === "success" && data?.notice ? (
            <FormNotice
              id={id}
              initialData={data?.notice}
              isEdit={true}
            />
          ) : 
          <div className="flex justify-center items-center min-h-screen">블로그를 찾을 수 없습니다.</div>
        }
    </>
  );
};

export default BlogEditpage;
