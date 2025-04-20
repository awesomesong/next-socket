import prisma from '@/prisma/db';
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from '@/src/app/lib/session';
import { pusherServer } from '@/src/app/lib/_pusher';

interface IParams {
    conversationId: string;
}

export async function GET (
    req: NextRequest,
    { params }: { params : IParams}
){
    
    try {
        const  { conversationId } = params;
        const user = await getCurrentUser();
        
        if(!user?.email) return NextResponse.json({message: '로그인이 되지 않았습니다. 로그인 후에 이용해주세요.'}, {status: 401})

        if (conversationId) {
            const isParticipating = await prisma.conversation.findFirst({
                where: {
                    id: conversationId,
                    userIds: {
                        has: user.id,
                    },
                },
                select: {
                    id: true,
                },
            });
        
            if (!isParticipating) {
                return NextResponse.json({ message: "해당 대화방에 접근할 수 없습니다." }, { status: 403 });
            }
        }
        
        const conversation = await prisma.conversation.findUnique({
            where: {
                id: conversationId
            },
            include: {
                users: true
            }
        });

        return NextResponse.json({ conversation }, {status: 200});
    } catch (error) {
        return NextResponse.json({message: "해당 대화방을 불러오지 못했습니다."})
    }
}

export async function DELETE(
    req: Request,
    { params }: { params : IParams}
){
    try {
        const { conversationId } = params;
        const user = await getCurrentUser();

        if(!user?.id) return NextResponse.json({message: '로그인이 되지 않았습니다. 로그인 후에 이용해주세요.'}, {status: 401})

        const existingConversation = await prisma?.conversation.findUnique({
            where: {
                id: conversationId
            },
            select: {
                id: true,
                userIds: true,
                users: {
                    select: {
                        id: true,
                        email: true
                    }
                },
                messages: true,
                isGroup: true,
                _count: {
                    select: {
                        users: true
                    }
                }
            }
        });

        if(!existingConversation) return NextResponse.json({message: '대화방이 존재하지 않습니다.'}, {status: 403})
            
        const existingConversationUsers =  existingConversation.users;
        if( existingConversation.messages.length > 0 ) {
            // 메시지가 있는 대화방: 사용자를 제거하고 시스템 메시지 생성
            const filteredUserIds = existingConversation.userIds.filter((id) => id !== user.id);
            const exitConversation = await prisma.conversation.update({
                where: {
                    id: conversationId,
                },
                data: {
                    userIds: {
                        set: filteredUserIds
                    }
                },
                select: {
                    userIds: true
                }
            });

            // 그룹 채팅일 때, 채팅방에 "OO님이 채팅방을 나갔습니다." 메시지 삽입
            if(existingConversation.isGroup) {
                await prisma.message.create({
                    data: {
                        body: `${user.name}님이 채팅방을 나갔습니다.`,
                        type: "system",
                        conversation: {
                            connect: {
                                id: conversationId
                            }
                        },
                        sender: {
                            connect: {
                                id: user.id
                            }
                        },
                        readStatuses: {
                            create: await prisma.user.findMany({
                                where: { 
                                    conversations: { 
                                        some: { 
                                            id: conversationId 
                                        } 
                                    } 
                                },
                                select: { id: true },
                            }).then(users =>
                              users.map(_user => ({ userId: _user.id, isRead: true}))
                            ),
                        },
                    },
                });
            }

        } else {
            // 메시지가 없으면 대화방 자체 삭제
            const deleteConversation = await prisma.conversation.deleteMany({
                where: {
                    id: conversationId,
                    userIds: {
                        hasSome: [user.id]
                    }
                },
            });    
        }

        // existingConversation.users.forEach((user) => {
        //     if(user.email) {
        //         pusherServer.trigger(user.email, 'conversation:remove', existingConversation);
        //     }
        // });

        return NextResponse.json({existingConversationUsers}, {status: 200});
    } catch(error) {
        console.log('ERROR_CONVERSATION_DELETE', error);
        return NextResponse.json({message: "알 수 없는 오류로 대화방에 참여한 아이디를 삭제하지 못했습니다."})
    }
}