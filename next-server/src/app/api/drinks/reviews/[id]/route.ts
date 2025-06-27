import { NextRequest, NextResponse } from "next/server";
import prisma from '@/prisma/db';
import { getCurrentUser } from '@/src/app/lib/session';

interface IParams {
    id?: string;
}

export async function PUT(
    req: NextRequest,
    { params }: { params: IParams }
) {
    const { id } = params;
    const user = await getCurrentUser();

    try {
        if (!user?.email) {
            return NextResponse.json({ message: '로그인 후에 수정할 수 있습니다.' }, { status: 401 });
        }

        const review = await prisma.drinkReview.findUnique({
            where: { id: id! },
            select: { authorEmail: true },
        });

        if (!review) {
            return NextResponse.json({ message: '존재하지 않는 리뷰입니다.' }, { status: 404 });
        }

        if (review.authorEmail !== user.email || user.role !== 'admin') {
            return NextResponse.json({ message: '수정 권한이 없습니다.' }, { status: 403 });
        }

        const { text } = await req.json();
        const updateReview = await prisma.drinkReview.update({
            where: { id: id! },
            data: { text, updatedAt: new Date() },
        });

        return NextResponse.json({ updateReview }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'Something went wrong!' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: IParams }
) {
    const { id } = params;
    const user = await getCurrentUser();

    try {
        if (!user?.email) {
            return NextResponse.json({ message: '로그인 후에 삭제할 수 있습니다.' }, { status: 401 });
        }

        const review = await prisma.drinkReview.findUnique({
            where: { id: id! },
            select: { authorEmail: true },
        });

        if (!review) {
            return NextResponse.json({ message: '존재하지 않는 리뷰입니다.' }, { status: 404 });
        }

        if (review.authorEmail !== user.email || user.role !== 'admin') {
            return NextResponse.json({ message: '삭제 권한이 없습니다.' }, { status: 403 });
        }

        await prisma.drinkReview.delete({
            where: { id: id! },
        });

        return NextResponse.json({ id }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'Something went wrong!' }, { status: 500 });
    }
}
