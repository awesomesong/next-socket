import { NextRequest, NextResponse } from "next/server";
import prisma from '@/prisma/db';
import { getCurrentUser } from '@/src/app/lib/session';

interface IParams {
    id?: string; // treated as slug for GET/POST and review id for PUT/DELETE
}

export async function GET(
    req: NextRequest,
    { params }: { params: IParams }
) {
    const { id: slug } = params;
    try {
        const limit = 20;
        const cursor = req.nextUrl.searchParams.get('cursor') || null;

        const reviewsCount = await prisma.drinkReview.count({
            where: { drinkSlug: slug },
        });

        const reviews = await prisma.drinkReview.findMany({
            where: { drinkSlug: slug },
            orderBy: { createdAt: 'desc' },
            ...(cursor && { cursor: { id: cursor } }),
            take: limit,
            skip: cursor ? 1 : 0,
            select: {
                id: true,
                text: true,
                authorEmail: true,
                createdAt: true,
                updatedAt: true,
                drinkSlug: true,
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        profileImage: true,
                        role: true,
                    },
                },
            },
        });

        return NextResponse.json({ reviews, reviewsCount }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: '리뷰를 불러오지 못했습니다.' }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: IParams }
) {
    const { id: slug } = params;
    const user = await getCurrentUser();

    try {
        if (!user?.email) {
            return NextResponse.json({ message: '로그인 후에 리뷰를 작성할 수 있습니다.' }, { status: 401 });
        }

        const { text } = await req.json();
        const newReview = await prisma.drinkReview.create({
            data: {
                drinkSlug: slug!,
                text,
                authorEmail: user.email,
            },
        });
        return NextResponse.json({ newReview }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'Something went wrong!' }, { status: 500 });
    }
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
