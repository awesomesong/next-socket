import { getCurrentUser } from "@/src/app/lib/session";
import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../prisma/db";
import { pusherServer } from "@/src/app/lib/_pusher";
import { ObjectId } from 'bson';

export async function GET(req: NextRequest){
    const user = await getCurrentUser();

    if(!user?.email) return new NextResponse('로그인이 되지 않았습니다.', {status: 401});

    try {
        // 1. 대화방 기본 정보
        const conversations = await prisma.conversation.findMany({
            orderBy: { lastMessageAt: "desc" },
            where: {
                userIds: {
                    has: user.id,
                },
            },
            select: {
            id: true,
            userIds: true,
            isGroup: true,
            isAIChat: true,
            aiAgentType: true,
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
            },
        });

        const conversationIds = conversations.map((c) => c.id);

        // 모든 대화방에 대해 한 번에 "비-시스템" 최신 메시지 조회 (Mongo aggregateRaw: 대화방당 1개만 반환)
        const convObjectIds = conversationIds.map((id) => {
            try { return new ObjectId(id); } catch { return null; }
        }).filter(Boolean) as ObjectId[];

        const grouped = await prisma.message.aggregateRaw({
            pipeline: [
                { $match: { conversationId: { $in: convObjectIds }, $or: [ { type: null }, { type: { $exists: false } }, { type: { $ne: 'system' } } ] } },
                { $sort: { createdAt: -1 } },
                { $group: {
                    _id: "$conversationId",
                    id: { $first: "$_id" },
                    body: { $first: "$body" },
                    type: { $first: "$type" },
                    createdAt: { $first: "$createdAt" },
                    conversationId: { $first: "$conversationId" },
                }},
            ]
        }) as unknown as Array<{ _id: any; id: any; body: string | null; type: string | null; createdAt: Date; conversationId: ObjectId }>;

        const lastMessageMap = new Map<string, any>();
        for (const m of grouped) {
            const cid = String(m.conversationId);
            if (!lastMessageMap.has(cid)) {
                lastMessageMap.set(cid, {
                    id: String(m.id ?? m._id ?? ''),
                    body: m.body ?? null,
                    type: m.type ?? null,
                    createdAt: m.createdAt,
                });
            }
        }

        // 보강: aggregateRaw로 누락된 대화방은 Prisma findFirst로 개별 보완
        const missingIds = conversationIds.filter((id) => !lastMessageMap.has(id));
        if (missingIds.length > 0) {
            await Promise.all(
                missingIds.map(async (cid) => {
                    const fallback = await prisma.message.findFirst({
                        where: {
                            conversationId: cid,
                            OR: [
                                { type: null },
                                { type: { not: 'system' } },
                            ],
                        },
                        orderBy: { createdAt: 'desc' },
                        select: {
                            id: true,
                            body: true,
                            createdAt: true,
                            type: true,
                        },
                    });
                    if (fallback) {
                        lastMessageMap.set(cid, fallback);
                    }
                })
            );
        }

        // 3. 모든 안 읽은 메시지 status 가져오기 (AI 대화방 제외)
        const unreadStatuses = await prisma.messageReadStatus.findMany({
            where: {
                userId: user.id,
                isRead: false,
                message: {
                    conversationId: {
                        in: conversationIds,
                    },
                    senderId: {
                        not: user.id, // ✅ 내가 보낸 메시지는 제외
                    },
                    conversation: {
                        isAIChat: false, // ✅ AI 대화방 제외
                    },
                },
            },
            select: {
                message: {
                    select: {
                        conversationId: true,
                    },
                },
            },
        });

        // conversationId 기준으로 unReadCount 세기 (AI 대화방 제외)
        const unreadMap = new Map<string, number>();
        unreadStatuses.forEach(({ message }) => {
            const id = message.conversationId;
            unreadMap.set(id, (unreadMap.get(id) || 0) + 1);
        });

        // 4. conversations에 message, unReadCount 병합 (모든 대화방은 마지막 메시지 1개만 포함)
        const conversationsWithDetails = conversations.map((conversation) => {
            const lastMessage = lastMessageMap.get(conversation.id);
            const unReadCount = conversation.isAIChat ? 0 : (unreadMap.get(conversation.id) || 0); // ✅ AI 대화방은 unReadCount를 0으로 설정

            // 메시지: 모든 대화방은 마지막 메시지 1개만 포함
            let messages = lastMessage ? [lastMessage] : [];

            return {
                ...conversation,
                messages,
                unReadCount,
            };
        });

        return NextResponse.json({ conversations: conversationsWithDetails }, { status: 200 });        
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
                            image: true,
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
                            image: true,
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