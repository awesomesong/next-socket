import prisma from '../../../../../../prisma/db';
import { NextRequest, NextResponse } from "next/server";

interface IParams {
    id?: string;
}

export async function POST(
    _req: NextRequest,
    { params }: { params : Promise<IParams>},
){
    const { id } = await params;

    try {
        const notice = await prisma.notice.findUnique({
            where: { id },
            select: { viewCount: true },
        });

        if (!notice) {
            return NextResponse.json({ message: '해당 공지사항의 글을 찾지 못했습니다.' }, { status: 404 });
        }

        const addedNoticeViewCount = await prisma.notice.update({
            where: { id },
            data: { viewCount: { increment: 1 } },
            select: { viewCount: true },
        });

        return NextResponse.json({
            message: 'View count incremented',
            viewCountIncremented: true,
            addedNoticeViewCount,
        }, { status: 200 });
    } catch {
        return NextResponse.json({ message: 'Something went wrong!' }, { status: 500 });
    }
}
