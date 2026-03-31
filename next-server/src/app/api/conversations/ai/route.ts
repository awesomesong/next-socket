import { getCurrentUser } from "@/src/app/lib/session";
import { NextResponse } from "next/server";
import prisma from '@/prisma/db';

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

        // 기존 AI 대화방 중 메시지가 없는 대화방이 있는지 확인
        const existingEmpty = await prisma.conversation.findFirst({
            where: {
                isAIChat: true,
                aiAgentType,
                userIds: { has: user.id },
                messages: { none: {} },
            },
            include: {
                users: {
                    select: { id: true, name: true, nickname: true, email: true, image: true },
                },
            },
        });

        if (existingEmpty) {
            return NextResponse.json({ ...existingEmpty, existingConversation: true }, { status: 200 });
        }

        // 빈 AI 방이 없으면 새로 생성 (중복 생성은 무해 — 하나만 사용됨)
        const created = await prisma.conversation.create({
            data: {
                name: "AI 어시스턴트와의 대화",
                isAIChat: true,
                aiAgentType,
                isGroup: false,
                userIds: [user.id],
                users: { connect: [{ id: user.id }] },
            },
            include: {
                users: {
                    select: { id: true, name: true, nickname: true, email: true, image: true },
                },
            },
        });

        return NextResponse.json({ ...created, existingConversation: false }, { status: 200 });

    } catch (error) {
        console.log('ERROR_CREATE_AI_CONVERSATION', error);
        return NextResponse.json(
            {message: 'AI 채팅방 생성 중 오류가 발생했습니다.'},
            {status: 500}
        );
    }
}
