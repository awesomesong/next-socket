import { getCurrentUser } from "@/src/app/lib/session";
import { NextRequest, NextResponse } from "next/server";
import prisma from '@/prisma/db';
import { pusherServer } from "@/src/app/lib/_pusher";

export async function POST(
    req: NextRequest
) {
    const user = await getCurrentUser();
    
    try { 
        const { conversationId } = await req.json();
        if(!user?.id || !user?.email) return NextResponse.json({message: '로그인이 되지 않았습니다. 로그인 후에 이용해주세요.'}, {status: 401})

        // 최신 메시지 1개만 가져오기
        const lastMessage = await prisma.message.findFirst({
            where: { conversationId },
            orderBy: { createdAt: "desc" },
            include: {
                seen: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        nickname: true,
                    },
                },
                sender: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        image: true,
                    },
                },
                conversation: {
                    select: {
                        isGroup: true,
                    },
                },
            },
        });
    
        if (!lastMessage) {
            return NextResponse.json({ message: "메시지가 존재하지 않습니다." }, { status: 404 });
        }
    
        // 이미 읽은 경우 처리 생략
        const alreadySeen = lastMessage.seen.some((userSeen) => userSeen.id === user.id);
        if (alreadySeen) {
            return NextResponse.json(lastMessage); // 그대로 응답
        }
    
        // 읽음 처리
        const updatedMessage = await prisma.message.update({
            where: { id: lastMessage.id },
            data: {
                seen: {
                    connect: { id: user.id },
                },
            },
            include: {
                seen: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        nickname: true,
                    },
                },
                sender: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        image: true,
                    },
                },
                conversation: {
                    select: {
                        isGroup: true,
                    },
                },
            },
        });
  
        return NextResponse.json({ seenMessageUser: updatedMessage });
    } catch (error) {
        console.log('ERROR_MESSAGES_SEEN', error);
        return new NextResponse('알 수 없는 오류로 메시지를 읽은 사람을 알 수 없습니다.', {status: 500});
    }
}