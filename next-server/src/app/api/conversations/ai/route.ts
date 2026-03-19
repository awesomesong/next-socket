import { getCurrentUser } from "@/src/app/lib/session";
import { NextResponse } from "next/server";
import prisma from '@/prisma/db';
import { randomUUID } from "crypto";

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        const body = await req.json();
        const { aiAgentType = "assistant" } = body;
        
        if(!user?.id || !user?.email) {
            return NextResponse.json(
                {message: '로그인이 되지 않았습니다. 로그인 후에 이용해주세요.'}, 
                {status: 401}
            );
        }

        // 기존 AI 대화방 중 메시지가 없는 대화방이 있는지 확인 (빠른 경로)
        const existingEmptyAIConversation = await prisma.conversation.findFirst({
            where: {
                isAIChat: true,
                aiAgentType: aiAgentType,
                userIds: {
                    has: user.id
                },
                messages: {
                    none: {} // 메시지가 없는 대화방
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

        if (existingEmptyAIConversation) {
            return NextResponse.json({ ...existingEmptyAIConversation, existingConversation: true }, { status: 200 });
        }

        // 동시 호출 시 중복 생성을 막기 위해 생성 구간만 직렬화
        const lockKey = `conv:ai:${user.id}:${aiAgentType}`;
        const result = await prisma.$transaction(
            async (tx) => {
                await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}));`;

                const again = await tx.conversation.findFirst({
                    where: {
                        isAIChat: true,
                        aiAgentType: aiAgentType,
                        userIds: { has: user.id },
                        messages: { none: {} },
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

                if (again) return { ...again, existingConversation: true as const };

                const conversationId = randomUUID();
                const created = await tx.conversation.create({
                    data: {
                        id: conversationId,
                        name: "AI 어시스턴트와의 대화",
                        isAIChat: true,
                        aiAgentType: aiAgentType,
                        isGroup: false,
                        userIds: [user.id],
                        users: { connect: [{ id: user.id }] }
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

                return { ...created, existingConversation: false as const };
            },
            { maxWait: 3000, timeout: 6000 }
        );

        // existingConversation 플래그까지 포함해서 반환
        return NextResponse.json(result, { status: 200 });

    } catch (error) {
        console.log('ERROR_CREATE_AI_CONVERSATION', error);
        return NextResponse.json(
            {message: 'AI 채팅방 생성 중 오류가 발생했습니다.'}, 
            {status: 500}
        );
    }
} 