import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/db";
import { getCurrentUser } from "@/src/app/lib/session";

interface ParamsProp {
  params: Promise<{ reviewId: string }>;
}

export async function PUT(req: NextRequest, { params }: ParamsProp) {
  const { reviewId } = await params;
  const user = await getCurrentUser();

  try {
    if (!user?.email) {
      return NextResponse.json(
        { message: "로그인 후에 수정할 수 있습니다." },
        { status: 401 }
      );
    }

    const review = await prisma.fragranceReview.findUnique({
      where: { id: reviewId },
      select: { authorEmail: true },
    });

    if (!review) {
      return NextResponse.json(
        { message: "존재하지 않는 리뷰입니다." },
        { status: 404 }
      );
    }

    if (review.authorEmail !== user.email) {
      return NextResponse.json(
        { message: "수정 권한이 없습니다." },
        { status: 403 }
      );
    }

    const { text } = await req.json();
    const updateReview = await prisma.fragranceReview.update({
      where: { id: reviewId },
      data: { text, updatedAt: new Date() },
    });

    return NextResponse.json({ updateReview }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: ParamsProp) {
  const { reviewId } = await params;
  const user = await getCurrentUser();

  try {
    if (!user?.email) {
      return NextResponse.json(
        { message: "로그인 후에 삭제할 수 있습니다." },
        { status: 401 }
      );
    }

    const review = await prisma.fragranceReview.findUnique({
      where: { id: reviewId },
      select: { authorEmail: true },
    });

    if (!review) {
      return NextResponse.json(
        { message: "존재하지 않는 리뷰입니다." },
        { status: 404 }
      );
    }

    if (review.authorEmail !== user.email) {
      return NextResponse.json(
        { message: "삭제 권한이 없습니다." },
        { status: 403 }
      );
    }

    await prisma.fragranceReview.delete({
      where: { id: reviewId },
    });

    return NextResponse.json({ id: reviewId }, { status: 200 });
  } catch {
    return NextResponse.json(
      { message: "Something went wrong!" },
      { status: 500 }
    );
  }
}
