import { NextRequest, NextResponse } from "next/server";
import prisma from '@/prisma/db';
import { getCurrentUser } from '@/src/app/lib/session';

interface IParams {
    slug?: string;
}

export async function GET(
    req: NextRequest,
    { params }: { params: IParams }
) {
    try {
        const { slug } = params;
        const limit = 20;
        const cursor = req.nextUrl.searchParams.get('cursor') || null;

        const reviewsCount = await prisma.drinkReview.count({
            where: { drinkSlug: slug }
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
                    }
                },
            }
        });

        return NextResponse.json({ reviews, reviewsCount }, { status: 200 });
    } catch(error) {
        console.log('@@error', error);
        return NextResponse.json({ message: '리뷰를 불러오지 못했습니다.' }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    { params }: { params: IParams }
) {
    const { slug } = params;
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
            }
        });
        return NextResponse.json({ newReview }, { status: 200 });
    } catch(error) {
        return NextResponse.json({ message: 'Something went wrong!' }, { status: 500 });
    }
}
