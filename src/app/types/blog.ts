import type { Comment } from '@prisma/client';
import { IUser } from '@/src/app/types/common';
import { InfiniteData } from '@tanstack/react-query';

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
}

export type BlogProps = {
    [key: string]: string | Date | Author;
    id: string;
    title: string;
    content: string;
    image: string;
    authorEmail: string;
    createdAt: Date;
    author: Author;
}

export type Author = {
    name: string;
    email: string;
    image: string;
    id?: string;
    role?: string;
}

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
    }
    viewCount: number;
}

export interface BlogImage {
    link: string;
    imageId: string;
    Blog?: Blog
}

export type BlogIdProps = {
    blogId: String
}

export type BlogCommentsProps = {
    comments: Comment[] & IUser[] | Author[]
}

export type BlogOldComments = {
    comments?: Comment[] & Author[];
    commentsCount?: number | undefined;
} | undefined;

export type BlogOldCommentsCount = {
    comments?: Comment[] & Author[] | undefined;
    commentsCount?: number;
} | undefined;

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
    { commentsCount: number }
];
  

export type BlogCommentsDataProps = InfiniteData<BlogCommentPage>;