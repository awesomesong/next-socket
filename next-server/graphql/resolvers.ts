// import { Context } from "@/pages/api/graphql";
import { image } from "@heroui/react";
import { PrismaClient } from "@prisma/client";

export type Context = {
    prisma: PrismaClient;
    user?: {
        id: string;
        email: string;
        name: string;
        image: string;
    };
};

// resolvers는 typeDefs에서 정의된 스키마를 실제로 수행하는 곳
// typeDefs에 있는 스키마와 일치해야함
export const resolvers = {
    Query: {
        posts: async (parent: any, args: any, context: Context) => {
            return await context.prisma.post.findMany({
                where: {
                    published: true
                },
                orderBy: {
                    createdAt: 'desc'
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    category: true,
                    published: true,
                    createdAt: true,
                    updatedAt: true,
                    image: true,
                    imageName: true,
                    writer: {
                        select: {
                            name: true,
                            image: true,
                            email: true,
                        },
                    },
                    postComments: {
                        select: {
                            id: true,
                        }
                    }
                },
            });
        },
        post: async (parent: any, args: any, context: Context) => {
            return await context.prisma.post.findUnique({
                where: {
                    id: args.id
                },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    category: true,
                    published: true,
                    createdAt: true,
                    updatedAt: true,
                    image: true,
                    imageName: true,
                    writer: {
                        select: {
                            name: true,
                            image: true,
                            email: true,
                        },
                    },
                    postComments: {
                        select: {
                            text: true,
                            writer: {
                                select: {
                                    id: true,
                                    name: true,
                                    image: true,
                                    email: true,
                                },
                            },
                        },
                    }
                },
            });
        },
        users: async (parent: any, args: any, context: Context) => {
            if (!args.email) throw new Error("이메일이 필요합니다.");

            return await context.prisma.user.findMany({
                orderBy: {
                    createdAt: 'desc',
                },
                where: {
                    NOT: {
                        email: args.email
                    }
                }
            });
        },
    },
    Post: {
        postComments: async (parent: any, args: any, context: Context) => {
            return await context.prisma.postComment.findMany({
                where: {
                    postId: parent.id
                },
                orderBy: {
                    createdAt: 'desc',
                },
                select: {
                    id: true,
                    text: true,
                    createdAt: true,
                    writer: {
                        select: {
                            name: true,
                            image: true,
                            email: true,
                            createdAt: true,
                        },
                    },
                },
            });
        },
    },
    Mutation: {
        addPost: async (parent: any, args: any, context: Context) => {
            const { user, prisma } = context;

            if (!user?.email) {
                throw new Error("로그인이 필요합니다.");
            }

            if (!args.title || !args.description || !args.category) {
                throw new Error("제목, 설명, 카테고리는 필수 입력값입니다.");
            }

            const post = await context.prisma.post.create({
                data: {
                    title: args.title,
                    description: args.description,
                    category: args.category,
                    published: args.published,
                    image: args.image,
                    imageName: args.imageName,
                    writer: {
                        connect: { id: user.id },
                    },
                },
            });

            return post;
        },
        updatePost: async (parent: any, args: any, context: Context) => {
            return await context.prisma.post.update({
                where: {
                    id: args.id
                },
                data: {
                    title: args.title,
                    description: args.description,
                    category: args.category,
                    published: args.published,
                    image: args.image,
                    imageName: args.imageName,
                }
            });
        },
        deletePost: async (parent: any, args: any, context: Context) => {
            const existingPosts = await context.prisma.post.findMany({
                where: {
                    id: { in: args.id }
                }
            });
        
            if (existingPosts.length === 0) {
                throw new Error("삭제할 소설이 존재하지 않습니다.");
            }

            const result = await context.prisma.post.deleteMany({
                where: {
                    id: {
                        in: args.id
                    }
                }
            });
        
            return { count: result.count };
        },
        addPostComment: async (parent: any, args: any, context: Context) => {
            const { user, prisma } = context;

            if (!user?.email) {
                throw new Error("로그인이 필요합니다.");
            }

            const postExists = await prisma.post.findUnique({
                where: { id: args.postId },
                select: { id: true }
            });
        
            if (!postExists) {
                throw new Error("존재하지 않는 소설입니다.");
            }

            return await context.prisma.postComment.create({
                data: {
                    post: {
                        connect: { id: args.postId },
                    },
                    text: args.text,
                    writer: {
                        connect: { id: user.id },
                    },
                },
            });
        },
        deletePostComment: async (parent: any, args: any, context: Context) => {
            return await context.prisma.postComment.delete({
                where: {
                    id: args.id,
                }
            });
        },
    }
};