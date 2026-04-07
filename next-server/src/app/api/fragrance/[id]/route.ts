import prisma from '../../../../../prisma/db';
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from '../../../lib/session';
import { generateBrandIndexSlug } from '../../../lib/fragranceSlug';

interface IParams {
    id: string;
}

export async function GET(req: NextRequest, { params }: { params: Promise<IParams> }) {
    const { id } = await params;

    try {
        const fragrance = await prisma.fragrance.findFirst({
            where: {
                OR: [
                    { id: id },
                    { slug: id }
                ]
            },
            include: {
                author: { select: { id: true, name: true, email: true, image: true, profileImage: true, role: true } }
            }
        });

        if (!fragrance) {
            return NextResponse.json({ message: '향수를 찾을 수 없습니다.' }, { status: 404 });
        }

        return NextResponse.json({ fragrance }, { status: 200 });
    } catch (e) {
        console.error('[GET /api/fragrance/[id]] error:', e);
        return NextResponse.json({ message: '예상치 못한 오류가 발생했습니다.'}, { status: 500 });
    }
}

export async function PATCH(req: Request, { params }: { params: Promise<IParams> }) {
    const user = await getCurrentUser();
    const { id: idOrSlug } = await params;

    try {
        if (!user?.email) {
            return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
        }

        const body = await req.json();
        const { brand, name, images, description, notes } = body;

        // GET과 동일하게 id 또는 slug로 레코드 찾기 (edit URL이 slug일 수 있음)
        const existing = await prisma.fragrance.findFirst({
            where: {
                OR: [{ id: idOrSlug }, { slug: idOrSlug }],
            },
        });
        if (!existing) {
            return NextResponse.json({ message: '향수를 찾을 수 없습니다.' }, { status: 404 });
        }

        const isAuthor = existing.authorEmail === user.email;
        const isAdmin = user.role === 'admin';
        if (!isAuthor && !isAdmin) {
            return NextResponse.json({ message: '수정 권한이 없습니다.' }, { status: 403 });
        }

        if (description !== undefined && !description) {
            return NextResponse.json({ message: '향수 상세 설명은 필수 입력값입니다.' }, { status: 400 });
        }
        if (Array.isArray(images) && images.length === 0) {
            return NextResponse.json({ message: '향수 이미지는 필수 입력값입니다.' }, { status: 400 });
        }

        // optional 필드(notes): 빈 문자열/undefined면 DB에 null로 저장 (POST와 동일)
        const notesValue =
            notes === undefined || notes === null || (typeof notes === "string" && notes.trim() === "")
                ? null
                : notes;

        const nextBrand = brand ?? existing.brand;
        const nextName = name ?? existing.name;

        let nextSlug = existing.slug;
        if (nextBrand !== existing.brand) {
            nextSlug = await generateBrandIndexSlug(nextBrand);
        }

        const updatedFragrance = await prisma.fragrance.update({
            where: { id: existing.id },
            data: {
                brand: nextBrand,
                name: nextName,
                slug: nextSlug,
                images: Array.isArray(images) ? images : existing.images,
                description: description ?? existing.description,
                notes: notesValue,
            },
            include: {
                author: {
                    select: { id: true, name: true, email: true, image: true, profileImage: true },
                },
            },
        });

        return NextResponse.json({ updatedFragrance }, { status: 200 });
    } catch (error: unknown) {
        console.error("[PATCH /api/fragrance/[id]]", error);
        const message = error instanceof Error ? error.message : "Something went wrong!";
        return NextResponse.json({ message }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<IParams> }) {
    const user = await getCurrentUser();
    const { id: idOrSlug } = await params;

    try {
        if (!user?.email) {
            return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 });
        }

        const existing = await prisma.fragrance.findFirst({
            where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
        });
        if (!existing) {
            return NextResponse.json({ message: '향수를 찾을 수 없습니다.' }, { status: 404 });
        }

        const isAuthor = existing.authorEmail === user.email;
        const isAdmin = user.role === 'admin';
        if (!isAuthor && !isAdmin) {
            return NextResponse.json({ message: '삭제 권한이 없습니다.' }, { status: 403 });
        }

        const [, deletedFragrance] = await prisma.$transaction([
            prisma.fragranceReview.deleteMany({ where: { fragranceSlug: existing.slug } }),
            prisma.fragrance.delete({ where: { id: existing.id } }),
        ]);

        return NextResponse.json({ deletedFragrance }, { status: 200 });
    } catch (error: unknown) {
        console.error("[DELETE /api/fragrance/[id]]", error);
        return NextResponse.json({ message: 'Something went wrong!' }, { status: 500 });
    }
}
