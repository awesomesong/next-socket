import prisma from '../../../../../prisma/db';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/fragrance/slug-exists?slug=xxx
 * 슬러그 존재 여부만 반환 (전체 데이터 불필요할 때 사용)
 * - exists: boolean
 * - id?: number (있을 때만, 수정 모드에서 자기 자신 여부 판단용)
 */
export async function GET(req: NextRequest) {
    try {
        const slug = new URL(req.url).searchParams.get('slug');
        if (!slug) {
            return NextResponse.json({ exists: false }, { status: 200 });
        }

        const row = await prisma.fragrance.findUnique({
            where: { slug },
            select: { id: true },
        });

        if (!row) {
            return NextResponse.json({ exists: false }, { status: 200 });
        }
        return NextResponse.json({ exists: true, id: row.id }, { status: 200 });
    } catch (error) {
        console.error('Error checking slug exists:', error);
        return NextResponse.json(
            { message: '슬러그 확인에 실패했습니다.' },
            { status: 500 }
        );
    }
}
