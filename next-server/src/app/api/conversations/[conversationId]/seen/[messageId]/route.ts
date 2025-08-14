import { getCurrentUser } from "@/src/app/lib/session";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/db";

interface ParamsProp {
  params: Promise<{ conversationId: string; messageId: string }>;
}

export async function POST(req: NextRequest, { params }: ParamsProp) {
  const user = await getCurrentUser();

  try {
    if (!user?.id || !user?.email) {
      return NextResponse.json(
        { message: "로그인이 되지 않았습니다. 로그인 후에 이용해주세요." },
        { status: 401 }
      );
    }

    const { messageId } = await params;

    // 1) 현재 seen 상태 조회 (id 포함)
    const current = await prisma.message.findUnique({
      where: { id: messageId },
      select: {
        conversationId: true,
        seen: {
          select: {
            id: true,
            name: true,
            nickname: true,
            email: true,
          },
        },
        conversation: {
          select: {
            users: {
              select: { id: true, email: true, name: true },
            },
          },
        },
      },
    });

    if (!current) {
      return NextResponse.json(
        { message: "메시지가 존재하지 않습니다." },
        { status: 404 }
      );
    }

    // 2) 이미 본 유저면 connect 생략하고 그대로 반환
    const alreadySeen = current.seen.some((u) => u.id === user.id);
    if (alreadySeen) {
      return NextResponse.json({ seenMessageUser: current });
    }

    // 3) 처음 보는 경우에만 connect
    const seenMessageUser = await prisma.message.update({
      where: { id: messageId },
      data: {
        seen: { connect: { id: user.id } },
      },
      select: {
        conversationId: true,
        seen: {
          select: {
            id: true,
            name: true,
            nickname: true,
            email: true,
          },
        },
        conversation: {
          select: {
            users: {
              select: { id: true, email: true, name: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ seenMessageUser });
  } catch (error) {
    console.log("ERROR_MESSAGES_SEEN", error);
    return new NextResponse(
      "알 수 없는 오류로 메시지를 읽은 사람을 알 수 없습니다.",
      { status: 500 }
    );
  }
}