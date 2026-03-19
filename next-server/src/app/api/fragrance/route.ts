import prisma from '../../../../prisma/db';
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from '../../lib/session';
import { generateBrandIndexSlug } from '../../lib/fragranceSlug';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const slug = searchParams.get('slug');

        if (slug) {
            // DB에서 먼저 찾고 없으면 정적 데이터에서 찾음
            const fragrance = await prisma.fragrance.findUnique({
                where: { slug },
                include: {
                    author: { select: { id: true, name: true, email: true, image: true, profileImage: true, role: true } }
                }
            });

            if (!fragrance) {
                return NextResponse.json({ message: '해당 향수를 찾을 수 없습니다.' }, { status: 404 });
            }

            return NextResponse.json({ fragrance }, { status: 200 });
        }

        const cursorParam = req.nextUrl.searchParams.get('cursor');
        const cursor = cursorParam ? cursorParam : null;
        const limit = 12;

        const fragrances = await prisma.fragrance.findMany({
            include: {
                author: { select: { id: true, name: true, email: true, image: true, profileImage: true, role: true } }
            },
            orderBy: [
                { createdAt: 'desc' },
                { id: 'desc' },
            ],
            ...(cursor && {
                cursor: {
                    id: cursor
                }
            }),
            take: limit,
            skip: cursor ? 1 : 0,
        });

        return NextResponse.json({ fragrances }, { status: 200 });
    } catch (error) {
        console.error('Error fetching fragrance:', error);
        return NextResponse.json({ message: '향수 정보를 가져오는데 실패했습니다.' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = await getCurrentUser();

    try {
        if (!user?.email) {
            return NextResponse.json({ message: '로그인 후에 글을 작성해주세요.' }, { status: 401 });
        }

        const { brand, name, images, description, notes } = await req.json();

        if (!brand || !name) {
            return NextResponse.json({ message: '브랜드와 이름은 필수 입력값입니다.' }, { status: 400 });
        }
        if (!description) {
            return NextResponse.json({ message: '향수 상세 설명은 필수 입력값입니다.' }, { status: 400 });
        }
        if (!images?.length) {
            return NextResponse.json({ message: '향수 이미지는 필수 입력값입니다.' }, { status: 400 });
        }

        // optional 필드(notes): 빈 문자열이면 DB에 null로 저장
        const notesValue = (notes?.trim() ?? '') === '' ? null : notes;

        const slug = await generateBrandIndexSlug(brand);

        const newFragrance = await prisma.fragrance.create({
            data: {
                brand,
                name,
                slug,
                images: images ?? [],
                description,
                notes: notesValue,
                authorEmail: user.email,
            },
            include: {
                author: {
                    select: { id: true, name: true, email: true, image: true, profileImage: true },
                },
            },
        });

        return NextResponse.json({ newFragrance }, { status: 200 });
    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
            return NextResponse.json({ message: '이미 존재하는 슬러그입니다.' }, { status: 400 });
        }
        return NextResponse.json({ message: 'Something went wrong!' }, { status: 500 });
    }
}
