import { getCurrentUser } from '../../lib/session';
import prisma from '../../../../prisma/db';
import { NextResponse } from "next/server";

export async function GET(){
    const user = await getCurrentUser();  

    if(!user) return new NextResponse('로그인이 되지 않았습니다.', {status: 401});

    try {
        const userInfo = await prisma.user.findUnique({
            where: {
                id: user.id
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                profileImage: true,
                role: true,
                provider: true,
                createdAt: true,
                _count: {
                    select: {
                        conversations: true,
                        messages: true
                    }
                }
            }
        });

        return NextResponse.json({userInfo} , {status: 200});
    } catch {
        return NextResponse.json({message: "사용자의 정보를 찾지 못했습니다."}, {status: 500});
    }
}