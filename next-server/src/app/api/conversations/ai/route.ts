import { getCurrentUser } from "@/src/app/lib/session";
import { NextResponse } from "next/server";
import prisma from '@/prisma/db';
import { ObjectId } from 'bson';

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

        // 먼저 기존 AI 대화방 중에서 메시지가 없는 대화방이 있는지 확인
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
            // 메시지가 없는 AI 대화방이 있으면 그 대화방 반환
            return NextResponse.json(existingEmptyAIConversation, {status: 200});
        }

        // 메시지가 없는 AI 대화방이 없으면 새로 생성
        const conversationId = new ObjectId().toHexString();
        const newConversation = await prisma.conversation.create({
            data: {
                id: conversationId,
                name: "AI 어시스턴트와의 대화",
                isAIChat: true,
                aiAgentType: aiAgentType,
                isGroup: false,
                users: {
                    connect: [{ id: user.id }]
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

        return NextResponse.json(newConversation, {status: 200});

    } catch (error) {
        console.log('ERROR_CREATE_AI_CONVERSATION', error);
        return NextResponse.json(
            {message: 'AI 채팅방 생성 중 오류가 발생했습니다.'}, 
            {status: 500}
        );
    }
} 