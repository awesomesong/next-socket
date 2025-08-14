import { getCurrentUser } from "@/src/app/lib/session";
import { NextRequest, NextResponse } from "next/server";
import prisma from '@/prisma/db';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    const user = await getCurrentUser();
    
    try { 
        const { conversationId } = await params;
        if(!user?.id || !user?.email) return NextResponse.json({message: '로그인이 되지 않았습니다. 로그인 후에 이용해주세요.'}, {status: 401})

        // 사용자가 접속한 채팅방에서 읽지 않은 메시지를 "읽음"으로 변경
        const readStatus = await prisma.messageReadStatus.updateMany({
            where: { 
                userId: user.id, 
                message: { 
                    conversationId 
                }, 
                isRead: false 
            },
            data: { isRead: true },
        });

        return NextResponse.json({readStatus});
    } catch (error) {
        console.log('ERROR_MESSAGES_SEEN', error);
        return new NextResponse('알 수 없는 오류로 메시지를 읽은 사람을 알 수 없습니다.', {status: 500});
    }
}