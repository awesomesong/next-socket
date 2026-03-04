import type { Comment, User } from "@prisma/client";
import { IUser } from "@/src/app/types/common";
import type { CommentType } from "@/src/app/types/comments";

export interface FormNoticeData {
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
  lastModifiedDate: string;
  value: string | Blob;
  size: number;
  type: string;
};

export type NoticeProps = {
  [key: string]: string | string[] | Date | Author;
  id: string;
  title: string;
  content: string;
  image: string[];
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

export interface Notice {
  id: string;
  title: string;
  author: {
    name: string | null;
    image: string | null;
  } | null;
  image: string[];
  createdAt: Date;
  _count: {
    comments: number;
  };
  viewCount: number;
}

// 공지사항 관련 타입 정의
export interface NoticeData {
  id: string;
  title?: string;
  content?: string;
  image?: string[];
  createdAt?: string | Date;
  author?: User;
  _count?: {
    comments?: number;
    [key: string]: number | undefined;
  };
  viewCount?: number;
}

export interface NoticeImage {
  link: string;
  imageId: string;
  Notice?: Notice;
}

export type NoticeIdProps = {
  noticeId: string;
};

export type NoticeCommentsProps = {
  comments: (Comment[] & IUser[]) | Author[];
};

export type NoticeOldComments =
  | {
      comments?: Comment[] & Author[];
      commentsCount?: number | undefined;
    }
  | undefined;

export type NoticeOldCommentsCount =
  | {
      comments?: (Comment[] & Author[]) | undefined;
      commentsCount?: number;
    }
  | undefined;



// ===== Socket payload types for notice events =====
export type NoticeCardForPrependPayload = {
  id: string;
  title: string;
  image: string[];
  createdAt: string | Date;
  author: { name: string | null; image: string | null } | null;
  _count: { comments: number };
  viewCount: number;
};

export type NoticeCommentNewPayload = {
  noticeId: string;
  senderId?: string;
  comment?: CommentType;
};
export type NoticeNewPayload = { notice: NoticeCardForPrependPayload };
export type NoticeUpdatedPayload = {
  notice: {
    id: string;
    title?: string;
    content?: string;
    image?: string[];
    createdAt?: string | Date;
    author?: { name: string | null; image: string | null } | null;
    _count?: { comments: number };
    viewCount?: number;
  };
};
export type NoticeDeletedPayload = { noticeId: string };

export type CreateNoticeRequest = {
  title: string;
  content: string;
  image: string[];
};

export type UpdateNoticeRequest = {
  title: string;
  content: string;
  image: string[];
};

export type CreateNoticeResponse = {
  success: boolean;
  message?: string;
  newNotice?: NoticeProps;
};

export type UpdateNoticeResponse = {
  success: boolean;
  message?: string;
  updateNotice?: NoticeProps;
};

export type DeleteNoticeResponse = {
  success: boolean;
  message?: string;
};

// ===== Notice Detail Query Data Type =====
// noticeDetailKey로 쿼리되는 공지사항 상세 데이터의 타입
export interface NoticeDetailData {
  id: string;
  title: string;
  content: string;
  image: string[];
  authorEmail: string;
  createdAt: Date | string;
  author: {
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  _count: {
    comments: number;
  };
  viewCount: number;
}

// noticeDetailKey의 queryData 타입
export type NoticeDetailQueryData = {
  notice: NoticeDetailData;
} | undefined;
