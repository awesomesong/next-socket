import { getCurrentUser } from "@/src/app/lib/session";
import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../prisma/db";
import { pusherServer } from "@/src/app/lib/_pusher";

export async function GET(req: NextRequest){
    const user = await getCurrentUser();

    if(!user?.email) return new NextResponse('로그인이 되지 않았습니다.', {status: 401});

    try {
        // 1. 모든 대화방 가져오기
        const conversations = await prisma.conversation.findMany({
            orderBy: {
                lastMessageAt: 'desc',
            },
            where: {
                userIds: {
                    has: user.id,
                },
            },
            select: {
            id: true,
            userIds: true,
            isGroup: true,
            name: true,
            lastMessageAt: true,
            users: {
                select: {
                    id: true,
                    name: true,
                    image: true,
                    email: true,
                },
            },
            messages: {
                where: {
                    type: {
                        not: 'system',
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 1,
                select: {
                    id: true,
                    body: true,
                    image: true,
                    createdAt: true,
                    type: true,
                    sender: {
                        select: {
                        id: true,
                        email: true,
                        name: true,
                        image: true,
                        },
                    },
                    seen: {
                        select: {
                        id: true,
                        email: true,
                        name: true,
                        },
                    },
                    readStatuses: {
                        select: {
                        id: true,
                        userId: true,
                        isRead: true,
                        },
                    },
                },
            },
            },
        });

        // 2. 모든 안 읽은 메시지 상태 가져오기 (메시지 ID, 개수)
        const unreadStatuses = await prisma.messageReadStatus.findMany({
            where: {
                userId: user.id,
                isRead: false,
                message: {
                    type: { not: 'system' },
                },
            },
            select: {
                messageId: true,
            },
        });

        // 3. 해당 메시지들의 대화방 ID 조회
        const messageIds = unreadStatuses.map((s) => s.messageId);

        const messages = await prisma.message.findMany({
            where: {
                id: { in: messageIds },
            },
            select: {
                id: true,
                conversationId: true,
            },
        });

        // 4. 대화방별 unread count 집계
        const conversationUnreadMap: Record<string, number> = {};

        for (const msg of messages) {
            conversationUnreadMap[msg.conversationId] =
                (conversationUnreadMap[msg.conversationId] || 0) + 1;
        }

        // 5. 최종 대화방 데이터에 unreadCount 병합
        const conversationsWithUnreadCount = conversations.map((conversation) => ({
            ...conversation,
            unreadCount: conversationUnreadMap[conversation.id] || 0,
        }));

        console.log("[CONVERSATION API]", JSON.stringify(conversationsWithUnreadCount, null, 2)); // ✅ 안전하게 찍기

        return NextResponse.json({ conversations: conversationsWithUnreadCount }, { status: 200 });        
    } catch ( error ) {
        return new NextResponse('대화방을 불러오는 중 오류가 발생하였습니다.', {status: 500})
    }
}

export async function POST(req: Request){

    try {        
        const user = await getCurrentUser();
        const body = await req.json();
        const { userId, isGroup, members, name } = body;

        if(!user?.email) return new NextResponse('로그인이 되지 않았습니다.', {status: 401});
        
        if(isGroup && (!members || members.length < 1)){
            return new NextResponse('대화방에 참여한 멤버가 앖습니다.');
        }

        // 그룹 채팅방 생성
        if(isGroup) {
            const newConversation = await prisma.conversation.create({
                data: {
                    name,
                    isGroup,
                    users: {
                        connect: [
                            ...members.map((member: {value: String}) => ({
                                    id: member.value
                            })),
                            {
                                id: user.id
                            }
                        ]
                    }
                },
                include: {
                    users: {
                        select: {
                            id: true,
                            name: true,
                            nickname: true,
                            email: true,
                        }
                    }
                }
            });

            // newConversation.users.forEach((user) => {
            //     if(user.email) {
            //         pusherServer.trigger(user.email, 'conversation:new', newConversation)
            //     }
            // })
            
            return NextResponse.json(newConversation, {status: 200});
        }

        // 1:1 대화방 존재 확인
        const existingConversation = await prisma.conversation.findMany({
            where: {
                userIds: {
                    hasEvery: [user.id, userId],
                },
                isGroup: false,
            },
        });
          
        
        const singleConversation = existingConversation[0];

        if(singleConversation){
            // 1:1 대화방이 있으면, 이미 생성된 대화방으로 이동
            return NextResponse.json({...singleConversation, existingConversation: true}, {status: 200});
        } else {
            // 1:1 대화방이 없으면, 대화방 새로 생성
            const newConversation = await prisma.conversation.create({
                data: {
                    users: {
                        connect: [
                            {
                                id: user.id
                            },
                            {
                                id: userId
                            }
                        ]
                    },
                    isGroup: false,
                },
                include: {
                    users: {
                        select: {
                            id: true,
                            name: true,
                            nickname: true,
                            email: true,
                        }
                    }
                }
            });
            
            return NextResponse.json(newConversation, {status: 200});
        }

    }catch(error){
        return new NextResponse('대화방을 불러오는 중 오류가 발생하였습니다.', {status: 500})
    }
}