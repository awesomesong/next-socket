import { getCurrentUser } from "@/src/app/lib/session";
import { NextResponse } from "next/server";
import prisma from '@/prisma/db';

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();
        const body = await req.json();
        const { message, image, conversationId, messageId } = body;
        
        if(!user?.id || !user?.email) return NextResponse.json({message: '로그인이 되지 않았습니다. 로그인 후에 이용해주세요.'}, {status: 401})
        if(Object.keys(body).length < 1) return NextResponse.json({message: '입력한 정보가 없습니다.' }, {status: 401});
        if(!conversationId && !image) return NextResponse.json({message: '이미지가 업로드 되지 않았습니다.'});
        if((!conversationId && !message) || (!conversationId && !image)) return NextResponse.error();

        // 🔹 conversation에 속한 사용자 목록을 미리 가져오기
        const conversationUsers = await prisma.user.findMany({
            where: { conversations: { some: { id: conversationId } } },
            select: { id: true, email: true },
        });

        // 🔹 메시지 생성
        const newMessage = await prisma.message.create({
            data: {
                id: messageId,
                body: message,
                type: 'text',
                image: image,
                conversation: { connect: { id: conversationId } },
                sender: { connect: { id: user.id } },
                seen: { connect: { id: user.id } },
            },
            select: {
                id: true,
                body: true,
                image: true,
                createdAt: true,
                conversationId: true,
                sender: {
                    select: { id: true, name: true, email: true, image: true },
                },
                seen: { select: { name: true, email: true } },
                conversation: { select: { isGroup: true, userIds: true } },
            }
        });

        // 🔹 생성된 메시지 기준으로 readStatus 추가
        const result = await prisma.messageReadStatus.createMany({
            data: conversationUsers.map((_user) => ({
                userId: _user.id,
                messageId: newMessage.id,
                isRead: _user.id === user.id,
            })),
        });

        // 🔹 conversation 업데이트 & 유저 목록 가져오기 (병렬 실행)
        const [updatedConversation, conversationUsersData] = await Promise.all([
            prisma.conversation.update({
                where: { id: conversationId },
                data: { lastMessageAt: new Date() }, // 최근 메시지 시간 업데이트
            }),
            prisma.conversation.findUnique({
                where: { id: conversationId },
                select: { users: { select: { email: true } } },
            })
        ]);

        // 🔹 conversationUsersData가 null이면 기본값 할당
        const safeConversationUsers = conversationUsersData ?? { users: [] };

        // 🔹 결과 반환
        return NextResponse.json({ newMessage, conversationUsers: safeConversationUsers }, {status: 200});

    } catch (error) {
        console.log('ERROR_MESSAGES', error);
        return NextResponse.json({message: '채팅이 입력되지 못했습니다.'}, {status: 500})
    }
}