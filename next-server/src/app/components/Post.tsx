import { IPost } from "@/typings";
import { memo, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@heroui/react";
import dayjs from "@/src/app/utils/day";
import CategoryBadge from "@/src/app/components/CategoryBadge";
import AvatarWithName from "@/src/app/components/AvatarWithName";
import FallbackNextImage from "@/src/app/components/FallbackNextImage";
import PostDeleteButton from "./PostDeleteButton";
import { useSession } from "next-auth/react";

type Props = {
  post: IPost;
  HandlerCheckItem: (id: string, isChecked: boolean) => void;
  isChecked: boolean;
};

const Post = ({ post, HandlerCheckItem, isChecked }: Props) => {
  const router = useRouter();
  const { data: session } = useSession();

  const sanitizedDescription = useMemo(() => {
    if (typeof window === 'undefined') {
      // SSR에서는 원본 텍스트 반환
      return post.description || '';
    }
    
    try {
      const DOMPurify = require('dompurify');
      return DOMPurify.sanitize(post.description || '');
    } catch (error) {
      console.warn('DOMPurify 로드 실패:', error);
      return post.description || '';
    }
  }, [post.description]);

  return (
    <article
      className="
        flex 
        flex-col
        gap-2
        h-fit
        p-4 
        bg-gray-100 
        dark:bg-neutral-800 
        rounded-md
        cursor-pointer
        shadow-md
      "
      onClick={(e) => {
        e.stopPropagation();
        router.push(`/posts/${post.id}`);
      }}
    >
      {session?.user?.email && (
        <div
          className="
            flex
            items-center
            justify-between
          "
        >
          <Checkbox
            className="w-8 h-8"
            size="lg"
            isSelected={isChecked}
            onValueChange={() => HandlerCheckItem(post.id, !isChecked)}
          />
          {session?.user?.email === post.writer?.email && (
            <PostDeleteButton
              postId={post.id}
              postTitle={post.title}
              selectedPosts={[
                { id: post?.id, writerEmail: post?.writer.email },
              ]}
              myEmail={session?.user?.email}
            />
          )}
        </div>
      )}
      {post.image && (
        <div className="relative h-60 max-[320px]:h-48 w-full">
          <FallbackNextImage
            src={post.image}
            alt={post.imageName!}
            width={0}
            height={0}
            sizes="100vw"
            priority={true}
            className="
              w-full 
              h-full 
              object-cover 
              rounded-lg 
              shadow-md
            "
          />
        </div>
      )}
      <CategoryBadge text={post.category} />
      <h1 className="font-bold text-xl line-clamp-2">{post.title}</h1>
      <pre
        className="line-clamp-4 whitespace-pre-wrap"
        dangerouslySetInnerHTML={{
          __html: sanitizedDescription,
        }}
      />
      <p className="flex flex-row items-center flex-wrap text-sm">
        <AvatarWithName image={post.writer?.image} name={post.writer?.name} />
        <span className="mx-2">·</span>
        <span>{dayjs(new Date(Number(post?.createdAt))).fromNow()}</span>
        <span className="mx-2">·</span>
        <span>댓글 {post.postComments.length ?? 0}</span>
      </p>
    </article>
  );
};

export default memo(Post);
