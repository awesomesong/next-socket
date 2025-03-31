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

        // 채팅에 참여한 사람
        const conversation = await prisma.conversation.findUnique({
            where: {
                id: conversationId
            },
            include: {
                messages: {
                    include: {
                        seen: {
                            select:{
                                id: true,
                                name: true,
                                nickname: true,
                                email: true,
                                emailVerified: true,
                                image: true,
                                profileImage: true,
                                createdAt: true,
                                updatedAt: true,
                            }
                        }
                    }
                },
                users: true
            }
        });

        if(!conversation) return NextResponse.json({message: '아이다가 존재하지 않습니다.'}, {status: 400})

        // 마지막 메시지 
        const lastMessage = conversation.messages.at(-1);

        if(!lastMessage) return NextResponse.json(conversation);

        // 마지막 메시지를 확인한 사람
        const updateMessage = await prisma.message.update({
            where: {
                id: lastMessage.id
            },
            data: {
                seen: {
                    connect: {
                        id: user.id
                    }
                }
            },
            include: {
                sender: {
                    select:{
                        id: true,
                        email: true,
                        name: true,
                        image: true,
                    }
                },
                seen: {
                    select:{
                        name: true,
                        nickname: true,
                        email: true,
                    }
                },
                conversation: {
                    select:{
                        isGroup: true
                    }
                }
            },
        });

        // await pusherServer.trigger(user.email, 'conversation:update', {
        //     id: conversationId,
        //     messages: [updateMessage]
        // });

        if(lastMessage.seenId.indexOf(user.id) !== -1){
            return NextResponse.json(conversation);
        }

        // await pusherServer.trigger(conversationId!, 'message:update', updateMessage);
        return NextResponse.json({updateMessage});
    } catch (error) {
        console.log('ERROR_MESSAGES_SEEN', error);
        return new NextResponse('알 수 없는 오류로 메시지를 읽은 사람을 알 수 없습니다.', {status: 500});
    }
}