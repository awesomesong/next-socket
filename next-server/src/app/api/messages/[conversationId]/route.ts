import prisma from '@/prisma/db';
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from '@/src/app/lib/session';
import { ObjectId as BSONObjectId } from "bson";

interface IParams {
    conversationId: string;
}

export async function GET (
    req: NextRequest,
    { params }: { params : Promise<IParams>}
){
    try {
        const limit = 50;
        const cursor = req.nextUrl.searchParams.get('cursor');
        const { conversationId } = await params;
        const user = await getCurrentUser();
        
        // ✅ 인증 확인 (user.id도 함께 체크)
        if(!user?.id || !user?.email) {
            return NextResponse.json(
                {message: '로그인이 되지 않았습니다. 로그인 후에 이용해주세요.'}, 
                {status: 401}
            );
        }

        // ✅ ObjectId 형식 검증
        if (!BSONObjectId.isValid(conversationId)) {
            return NextResponse.json(
                {message: 'conversationId 형식이 올바르지 않습니다.'}, 
                {status: 400}
            );
        }
        
        // ✅ 대화방 존재 및 참여자 확인
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            select: { 
                id: true, 
                userIds: true,
                lastMessageId: true,
            }
        });
        
        if (!conversation) {
            return NextResponse.json(
                {message: '대화방을 찾을 수 없습니다.'}, 
                {status: 404}
            );
        }

        // ✅ 권한 확인: 참여자인지 확인
        if (!conversation.userIds.includes(user.id)) {
            return NextResponse.json(
                {message: '대화방 참여자가 아닙니다.'}, 
                {status: 403}
            );
        }
        
        // ✅ 메시지 조회 (readStatuses 포함)
        const messages = await prisma.message.findMany({
            where: {
                conversationId: conversationId
            },
            orderBy: [
                { createdAt: 'desc' },
                { id: 'desc' }
            ],
            ...(cursor && {
                cursor: {
                    id: cursor
                }
            }),
            take: limit, 
            skip: cursor ? 1 : 0,
            select: {
                id: true,
                body: true,
                image: true,
                createdAt: true,
                type: true,
                isAIResponse: true,
                isError: true,
                conversationId: true,
                senderId: true,
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
                        userIds: true
                    }
                },
            },
        });

        const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null;

        // ✅ 마지막 메시지의 읽은 사용자 정보 조회 (첫 페이지에서만)
        let seenUsersForLastMessage: Array<{ id: string; name: string | null; image: string | null }> = [];
        if (!cursor && messages.length > 0) {
            const lastMessage = messages[0]; // 가장 최신 메시지 (desc 정렬)
            const lastMessageId = lastMessage.id;
            const lastMessageAt = lastMessage.createdAt;

            // ✅ 안전하게 Set 사용: 중복 제거 + undefined 방지
            const exclude = new Set<string>([user.id, lastMessage.senderId]);
            const readStates = await prisma.conversationRead.findMany({
                where: {
                    conversationId,
                    userId: { notIn: [...exclude] },
                    OR: [
                        { lastSeenMsgId: lastMessageId },                         // ID 기반
                        ...(lastMessageAt ? [{ lastSeenAt: { gte: lastMessageAt } }] : []), // 시간 기반 fallback
                    ],
                },
                include: { 
                    user: { 
                        select: { id: true, name: true, image: true } 
                    } 
                },
            });
            seenUsersForLastMessage = readStates.map(read => read.user);
        }

        return NextResponse.json({ 
            messages, 
            nextCursor,
            seenUsersForLastMessage // ✅ 마지막 메시지 읽은 사용자 정보
        }, {status: 200});
    } catch (error) {
        console.error("[GET /api/messages/[conversationId]] error:", error);
        return NextResponse.json(
            {message: "해당 대화방을 불러오지 못했습니다."}, 
            {status: 500}
        );
    }
}