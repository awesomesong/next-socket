import prisma from '../../../../../prisma/db';
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/src/app/lib/session";

type ParamsProp = {
    params: Promise<{
        id: string;
    }>
}

export async function GET(req: Request, { params }: ParamsProp){
    const { id: noticeId } = await params;

    try {
        const notice = await prisma.notice.findFirst({
            where: {
                id: noticeId
            },
            select: {
                id: true,
                title: true,
                content: true,
                image: true,
                authorEmail: true,
                createdAt: true,
                author: {
                    select: {
                        name: true,
                        email: true,
                        image: true,
                    }
                },
                _count: {
                    select: {
                        comments: true
                    }
                },
                viewCount: true,
            }
        });
    
        return NextResponse.json({notice}, { status: 200 });

    } catch (e) {
        console.error('[GET /api/notice/[id]] error:', e);
        return NextResponse.json({message: '해당 글을 불러오지 못했습니다.'}, { status: 500 });
    }
}

export async function DELETE(req: Request,  { params }: ParamsProp) {
    const user = await getCurrentUser();
    const { id: noticeId } = await params;

    try {
        if(!user?.email) {
            return NextResponse.json({ message: '로그인 후에 삭제를 할 수 있습니다.'}, { status: 401 })
        }

        const notice = await prisma.notice.findUnique({
            where: { id: noticeId },
        });

        if(!notice) {
            return NextResponse.json({message: '해당 글을 찾을 수 없습니다.'}, { status: 404 });
        }

        if (notice.authorEmail !== user.email) {
            return NextResponse.json({ message: "해당 글을 삭제할 권한이 없습니다." },{ status: 403 });
        }

        await prisma.notice.delete({ 
            where: { 
                id: noticeId
            },
        });

        return NextResponse.json({message: '해당 글을 삭제하였습니다.'}, { status: 200 });

    } catch {
        return NextResponse.json({message: '오류가 발생하여, 해당 글을 삭제하지 못했습니다.'}, { status: 500 });
    }
}


export async function PUT(req: Request, { params }: ParamsProp){
    const user = await getCurrentUser();
    const { id: noticeId } = await params;

    try {
        if(!user?.email) {
            return NextResponse.json({ message: '로그인 후에 수정을 할 수 있습니다.'}, { status: 401 })
        }

        const notice = await prisma.notice.findUnique({
            where: { id: noticeId },
            select: { authorEmail: true },
        });
      
        if (!notice) {
            return NextResponse.json({ message: '존재하지 않는 공지사항입니다.' }, { status: 404 });
        }
      
        if (notice.authorEmail !== user.email) {
            return NextResponse.json({ message: '해당 글을 수정할 권한이 없습니다.' }, { status: 403 });
        }

        const { title, content, image } = await req.json();

        const imageArray: string[] = Array.isArray(image) ? image : [];

        const updateNotice = await prisma.notice.update({
            where: {
                id: noticeId
            },
            data: {
                title,
                content,
                image: imageArray,
                authorEmail: user.email,
                updatedAt: new Date(),
            }
        });
        return NextResponse.json({updateNotice}, {status: 200});

    } catch {
        return NextResponse.json({message: 'Something went wrong!'}, { status: 500 });
    }
}