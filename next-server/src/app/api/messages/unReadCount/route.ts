import { getCurrentUser } from "@/src/app/lib/session";
import { NextRequest, NextResponse } from "next/server";
import prisma from '@/prisma/db';

export async function GET(
    req: NextRequest
) {
    
    try { 
        const user = await getCurrentUser();

        if(!user?.email) return NextResponse.json({message: '로그인이 되지 않았습니다. 로그인 후에 이용해주세요.'}, {status: 401})

        const unReadCount = await prisma.messageReadStatus.count({
            where: {
                isRead: false,
                userId: user.id
            },
        });

        return NextResponse.json({unReadCount});
    } catch (error) {
        return new NextResponse('알 수 없는 오류로 안 읽은 메시지의 수를 알 수 없습니다.', {status: 500});
    }
}