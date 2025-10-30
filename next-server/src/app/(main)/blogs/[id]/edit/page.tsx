"use client";
import { FormBlog } from "@/src/app/components/FormBlog";
import { BlogSkeleton } from "@/src/app/components/skeleton/BlogSkeleton";
import getBlog from "@/src/app/lib/getBlog";
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

  // const { blog, message } = await getBlog(id);
  const { data: session } = useSession();
  const { data, status } = useQuery({
    queryKey: ["blogDetailEdit", id],
    queryFn: () => getBlog(id),
    enabled: !!session?.user?.email,
  });

  return (
    <>
      {status === 'pending'
        ? (<BlogSkeleton />) 
        : status === "success" && data?.blog ? (
            <FormBlog
              id={id}
              initialData={data?.blog}
              message={data?.message}
              isEdit={true}
            />
          ) : 
          <div className="flex justify-center items-center min-h-screen">블로그를 찾을 수 없습니다.</div>
        }
    </>
  );
};

export default BlogEditpage;
