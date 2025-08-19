import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/src/app/lib/session';
import prisma from '@/prisma/db';
import { ObjectId } from 'bson';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    if (!user?.id || !user?.email) {
      return new NextResponse('로그인이 필요합니다.', { status: 401 });
    }

    const { conversationId, body, message, type, isAIResponse, messageId, image, isError } = await req.json();

    // ✅ messageId가 제공된 경우 중복 체크
    if (messageId) {
      const existingMessage = await prisma.message.findUnique({
        where: { id: messageId }
      });
      
      if (existingMessage) {
        return NextResponse.json({
          newMessage: existingMessage,
          conversationUsers: { users: [] },
          readStatuses: { count: 0 }
        });
      }
    }

    // 대화방의 모든 사용자 가져오기 (MessageReadStatus 생성을 위해)
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { 
        users: { 
          select: { id: true, email: true } 
        } 
      }
    });

    if (!conversation) {
      return new NextResponse('대화방을 찾을 수 없습니다.', { status: 404 });
    }

    // 메시지 저장 (발신자는 자동으로 읽음 처리)
    const inferredType = image ? 'image' : 'text';
    const newMessage = await prisma.message.create({
      data: {
        id: messageId || new ObjectId().toHexString(),
        body: body || message,
        image, // 이미지 URL 저장
        type: type || inferredType,
        conversation: { connect: { id: conversationId } },
        sender: { connect: { id: user.id } },
        seen: { connect: { id: user.id } }, // 발신자는 자동으로 읽음
        isAIResponse: isAIResponse || false,
        isError: isError || false,
      },
      select: {
        id: true,
        body: true,
        image: true, // 이미지 필드 포함
        type: true,
        createdAt: true,
        conversationId: true,
        sender: {
          select: { id: true, name: true, email: true, image: true },
        },
        seen: { select: { name: true, email: true } },
        conversation: { select: { isGroup: true, userIds: true } },
      }
    });

    // MessageReadStatus 생성 (모든 사용자에 대해)
    const messageReadStatuses = await prisma.messageReadStatus.createMany({
      data: conversation.users.map((_user) => ({
        userId: _user.id,
        messageId: newMessage.id,
        isRead: _user.id === user.id, // 발신자는 자동으로 읽음 처리
      })),
    });

    // 대화방 업데이트 & 최신 유저 목록 가져오기 (병렬 실행)
    const [updatedConversation, conversationUsersData] = await Promise.all([
      prisma.conversation.update({
        where: { id: conversationId },
        data: { lastMessageAt: new Date() }, // 최근 메시지 시간 업데이트
      }),
      prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { 
          users: { 
            select: { 
              id: true,
              name: true, 
              email: true,
              image: true 
            } 
          } 
        },
      })
    ]);

    // conversationUsersData가 null이면 기본값 할당
    const safeConversationUsers = conversationUsersData ?? { users: [] };

    return NextResponse.json({
      newMessage,
      conversationUsers: safeConversationUsers,
      readStatuses: messageReadStatuses
    });
  } catch (error) {
    console.error('메시지 저장 오류:', error);
    
    // ✅ 더 자세한 에러 정보 로깅
    if (error instanceof Error) {
      console.error('에러 메시지:', error.message);
      console.error('에러 스택:', error.stack);
    }
    
    return new NextResponse('서버 오류', { status: 500 });
  }
}