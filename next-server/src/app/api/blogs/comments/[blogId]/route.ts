import { getCurrentUser } from '@/src/app/lib/session';
import prisma from '../../../../../../prisma/db';
import { NextRequest, NextResponse } from "next/server";

interface ParamsProp {
    params: Promise<{
        blogId?: string;
    }>
}

export async function GET(
    req: NextRequest,
    { params }: ParamsProp
){
    try {
        const { blogId } = await params;
        const limit = 15;
        const cursor  = req.nextUrl.searchParams.get('cursor') || null;

        const commentsCount = await prisma.comment.count({
            where: {
                blogId: blogId    
            },
        });

        const comments = await prisma.comment.findMany({
            where: {
                blogId
            },
            orderBy: {
                createdAt: 'desc'
            },
            ...(cursor && {
                cursor: {
                    id: cursor,
                }
            }),
            take: limit,
            skip: cursor ? 1 : 0,
            select: {
                id: true,
                text: true,
                authorEmail: true,
                createdAt: true,
                updatedAt: true,
                blogId: true,
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        profileImage: true,
                        role: true,
                    }
                },
            }
        });
        return NextResponse.json({comments, commentsCount}, { status: 200 });
    } catch {
        return NextResponse.json({message: '댓글을 불러오지 못했습니다.'}, { status: 500 });
    }
}

export async function POST(
    req: Request,
    { params }: ParamsProp
){
    const { blogId } = await params;
    const user = await getCurrentUser();
    
    try {
        if(!user?.email) {
            return NextResponse.json({ message: '로그인 후에 댓글을 작성할 수 있습니다.'}, { status: 401 })
        }

        const { text } = await req.json();
        const newComment = await prisma.comment.create({
            data: {
                blogId: blogId,
                text,
                authorEmail: user.email,
            }
        });
        return NextResponse.json({newComment}, {status: 200});

    } catch {
        return NextResponse.json({message: 'Something went wrong!'}, { status: 500 });
    }
}
