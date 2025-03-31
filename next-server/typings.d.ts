import { Files, Author, Post, PostComment } from "@prisma/client";

interface PostCommentsWithWriter extends PostComment {
    writer: Pick<User, "name" | "image" | "email"> | null;
}

interface IPost extends Post {
    postComments: PostCommentsWithWriter[];
    writer: {
        name: string;
        image: string;
        email: string;
    }
}