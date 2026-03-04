import prisma from '../../../../../prisma/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const result = await prisma.fragrance.findMany({
            select: { brand: true },
            distinct: ['brand'],
            orderBy: { brand: 'asc' },
        });

        const brands = result.map((r) => r.brand);

        return NextResponse.json({ brands }, { status: 200 });
    } catch (error) {
        console.error('Error fetching fragrance brands:', error);
        return NextResponse.json({ message: '브랜드 목록을 가져오는데 실패했습니다.' }, { status: 500 });
    }
}
