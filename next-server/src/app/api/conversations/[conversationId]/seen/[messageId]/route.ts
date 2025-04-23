import { getCurrentUser } from "@/src/app/lib/session";
import { NextRequest, NextResponse } from "next/server";
import prisma from '@/prisma/db';

export async function POST(
    req: NextRequest
) {
    const user = await getCurrentUser();
    
    try { 
        const { messageId } = await req.json();
        if(!user?.id || !user?.email) return NextResponse.json({message: '로그인이 되지 않았습니다. 로그인 후에 이용해주세요.'}, {status: 401})

        // 마지막 메시지를 확인한 사람
        const seenMessageUser = await prisma.message.update({
            where: {
                id: messageId
            },
            data: {
                seen: {
                    connect: {
                        id: user.id
                    }
                }
            },
            select: {
                conversationId: true,
                seen: {
                    select:{
                        name: true,
                        nickname: true,
                        email: true,
                    }
                },
                conversation: { 
                    select: {
                        users: {
                                select: {
                                id: true,
                                email: true,
                                name: true,
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json({seenMessageUser});
    } catch (error) {
        console.log('ERROR_MESSAGES_SEEN', error);
        return new NextResponse('알 수 없는 오류로 메시지를 읽은 사람을 알 수 없습니다.', {status: 500});
    }
}