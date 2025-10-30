import type { Comment, User } from "@prisma/client";
import { IUser } from "@/src/app/types/common";
import { InfiniteData } from "@tanstack/react-query";

export interface FormBlogData {
  [key: string]: string;
  title: string;
  content: string;
}

export interface FormPostData {
  title: string;
  description: string;
  category: string;
  published: boolean;
  image: string;
  imageName: string;
}

export type FormPostFilesData = {
  name: string;
  lastModified: number;
  lastModifiedDate: String;
  value: string | Blob;
  size: number;
  type: string;
};

export type BlogProps = {
  [key: string]: string | Date | Author;
  id: string;
  title: string;
  content: string;
  image: string;
  authorEmail: string;
  createdAt: Date;
  author: Author;
};

export type Author = {
  name: string;
  email: string;
  image: string;
  id?: string;
  role?: string;
};

export interface Blog {
  id: string;
  title: string;
  author: {
    name: string | null;
    image: string | null;
  } | null;
  image: string;
  createdAt: Date;
  _count: {
    comments: number;
  };
  viewCount: number;
}

// 블로그 관련 타입 정의
export interface BlogData {
  id: string;
  title?: string;
  content?: string;
  image?: string;
  createdAt?: string | Date;
  author?: User;
  _count?: {
    comments?: number;
    [key: string]: number | undefined;
  };
  viewCount?: number;
}

export interface BlogImage {
  link: string;
  imageId: string;
  Blog?: Blog;
}

export type BlogIdProps = {
  blogId: String;
};

export type BlogCommentsProps = {
  comments: (Comment[] & IUser[]) | Author[];
};

export type BlogOldComments =
  | {
      comments?: Comment[] & Author[];
      commentsCount?: number | undefined;
    }
  | undefined;

export type BlogOldCommentsCount =
  | {
      comments?: (Comment[] & Author[]) | undefined;
      commentsCount?: number;
    }
  | undefined;

export type CommentType = {
  id: string;
  text: string;
  createdAt: string; // or Date if you're converting
  updatedAt: string;
  authorEmail: string | null;
  blogId: string | null;
  author: Author;
};

export type BlogCommentPage = [
  { comments: CommentType[] },
  { commentsCount: number },
];

export type BlogCommentsDataProps = InfiniteData<BlogCommentPage>;

// ===== Socket payload types for blog events =====
export type BlogCardForPrependPayload = {
  id: string;
  title: string;
  image: string;
  createdAt: string | Date;
  author: { name: string | null; image: string | null } | null;
  _count: { comments: number };
  viewCount: number;
};

export type BlogCommentNewPayload = {
  blogId: string;
  senderId?: string;
  comment?: CommentType;
};
export type BlogNewPayload = { blog: BlogCardForPrependPayload };
export type BlogUpdatedPayload = {
  blog: {
    id: string;
    title?: string;
    content?: string;
    image?: string;
    createdAt?: string | Date;
    author?: { name: string | null; image: string | null } | null;
    _count?: { comments: number };
    viewCount?: number;
  };
};
export type BlogDeletedPayload = { blogId: string };

export type CreateBlogRequest = {
  title: string;
  content: string;
  image: string;
};

export type UpdateBlogRequest = {
  title: string;
  content: string;
  image: string;
};

export type CreateBlogResponse = {
  success: boolean;
  message?: string;
  newBlog?: BlogProps;
};

export type UpdateBlogResponse = {
  success: boolean;
  message?: string;
  updateBlog?: BlogProps;
};

export type DeleteBlogResponse = {
  success: boolean;
  message?: string;
};