import { getCurrentUser } from "@/src/app/lib/session";
import { NextResponse } from "next/server";
import prisma from "@/prisma/db";

export const runtime = "nodejs";

const toSortedIds = (ids: string[]) => [...new Set(ids)].sort();

/**
 * 기존 대화방 조회 전용 (생성 없음)
 * GET /api/conversations/find?userId=xxx          → 1:1
 * GET /api/conversations/find?isGroup=true&members=a,b,c → 그룹
 */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user?.id) {
    return new NextResponse("로그인이 필요합니다.", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const isGroup = searchParams.get("isGroup") === "true";
  const membersParam = searchParams.get("members");

  try {
    if (isGroup && membersParam) {
      const memberIds = membersParam.split(",").filter(Boolean);
      const memberIdsSorted = toSortedIds([user.id, ...memberIds]);

      const found = await prisma.conversation.findFirst({
        where: { isGroup: true, userIds: { equals: memberIdsSorted } },
        select: { id: true },
      });

      return NextResponse.json({ conversationId: found?.id ?? null });
    }

    if (userId) {
      const userIdsSorted = toSortedIds([user.id, userId]);

      const found = await prisma.conversation.findFirst({
        where: { isGroup: false, isAIChat: { not: true }, userIds: { equals: userIdsSorted } },
        select: { id: true },
      });

      return NextResponse.json({ conversationId: found?.id ?? null });
    }

    return new NextResponse("파라미터가 필요합니다.", { status: 400 });
  } catch {
    return new NextResponse("서버 오류", { status: 500 });
  }
}
