import prisma from '@/prisma/db';
import { getCurrentUser } from "@/src/app/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET( req: NextRequest ){
    const user = await getCurrentUser();

    if (!user?.email) {
        return NextResponse.json(
            { message: '로그인이 필요합니다.' },
            { status: 401 }
        );
    }

    try {
        const users = await prisma.user.findMany({
            orderBy: {
                name: 'asc',
            },
            where: {
                NOT: {
                    email: user.email
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true
            }
        });

        return NextResponse.json({users}, {status: 200});
    } catch(error) {
        return NextResponse.json({message: '채팅 멤버를 찾지 못했습니다.'}, { status: 500 });
    }
};