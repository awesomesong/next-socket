import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/src/app/lib/session";
import prisma from "@/prisma/db";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> },
) {
  const user = await getCurrentUser();
  if (!user?.id || !user?.email) {
    return NextResponse.json({ message: "로그인이 되지 않았습니다." }, { 
      status: 401,
      headers: { "Cache-Control": "no-store" }
    });
  }

  const { conversationId } = await params;

  try {
    // 쿼리스트링에서 includeSeenUsers 플래그 확인
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('includeSeenUsers');
    const includeSeenUsers = q?.toLowerCase() === 'true';
    
    // 1) 권한 확인 (멤버십 체크)
    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId, userIds: { has: user.id } },
      select: { 
        id: true, 
        userIds: true,
        lastMessageId: true,
      },
    });
    if (!conv) {
      return NextResponse.json({ message: "접근 권한이 없습니다." }, { 
        status: 403,
        headers: { "Cache-Control": "no-store" }
      });
    }

    // ✅ 서버 결정 워터마크: 실제 최신 메시지 기준으로 보정
    const latest = await prisma.message.findFirst({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      select: { id: true, createdAt: true },
    });

    if (latest) {
      await prisma.conversationRead.upsert({
        where: { 
          conversationId_userId: { 
            conversationId, 
            userId: user.id 
          } 
        },
        create: {
          conversationId,
          userId: user.id,
          lastSeenMsgId: latest.id,        // 서버가 결정한 실제 최신 메시지 ID
          lastSeenAt: latest.createdAt,    // 서버가 결정한 실제 최신 시점
        },
        update: {
          lastSeenMsgId: latest.id,        // 서버가 결정한 실제 최신 메시지 ID
          lastSeenAt: latest.createdAt,    // 서버가 결정한 실제 최신 시점
        },
      });
    }

    // 2) 마지막 메시지 정보 조회 (senderId 포함, includeSeenUsers 처리용)
    let messageSenderId: string | null = null;
    let seenUsersForLastMessage: Array<{ id: string; name: string | null; email: string | null; image: string | null }> = [];
    
    if (conv.lastMessageId) {
      const lastMessage = await prisma.message.findUnique({
        where: { id: conv.lastMessageId },
        select: { createdAt: true, senderId: true },
      });
      
      if (lastMessage) {
        messageSenderId = lastMessage.senderId;
        
        // ✅ includeSeenUsers=true라면 읽은 사용자 조회
        if (includeSeenUsers) {
          const lastMessageId = conv.lastMessageId;
          const lastMessageAt = lastMessage.createdAt;

          // 발신자 제외 (발신자는 읽음 표시에서 제외)
          const exclude = new Set<string>([lastMessage.senderId]);
          
          const readStates = await prisma.conversationRead.findMany({
            where: {
              conversationId,
              userId: { notIn: [...exclude] },
              OR: [
                { lastSeenMsgId: lastMessageId },                         // ID 기반
                { lastSeenAt: { gte: lastMessageAt } },                   // 시간 기반 fallback
              ],
            },
            include: { 
              user: { 
                select: { id: true, name: true, email: true, image: true } 
              } 
            },
          });
          seenUsersForLastMessage = readStates.map(read => read.user);
        }
      }
    }

    // ✅ 기본 응답
    const baseResponse = {
      conversationId,
      lastMessageId: conv.lastMessageId,
      readCount: seenUsersForLastMessage.length,
      messageSenderId, // ✅ 메시지 발신자 ID 추가
    };

    // ✅ 필요할 때만 확장 정보 추가
    if (includeSeenUsers) {
      return NextResponse.json({
        ...baseResponse,
        seenUsers: seenUsersForLastMessage.map(u => ({
          id: u.id,
          name: u.name,
          image: u.image,
        })),
      }, { status: 200, headers: { "Cache-Control": "no-store" }});
    }

    // ✅ 디폴트: 기본 응답만
    return NextResponse.json(baseResponse, { 
      status: 200, 
      headers: { "Cache-Control": "no-store" } 
    });

  } catch (err) {
    console.error("[READ_STATE_API] error", err);
    return NextResponse.json({ message: "읽음 상태 처리 중 오류" }, { 
      status: 500,
      headers: { "Cache-Control": "no-store" }
    });
  }
}