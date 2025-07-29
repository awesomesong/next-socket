import prisma from '@/prisma/db';
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from '@/src/app/lib/session';

interface IParams {
    conversationId: string;
}

export async function GET (
    req: NextRequest,
    { params }: { params : Promise<IParams>}
){
    try {
        const limit = 50;
        const cursor  = req.nextUrl.searchParams.get('cursor');
        // const cursor = searchParams ? searchParams : null;


        const  { conversationId } = await params;
        const user = await getCurrentUser();
        
        if(!user?.email) return NextResponse.json({message: '로그인이 되지 않았습니다. 로그인 후에 이용해주세요.'}, {status: 401})
        
        const messages = await prisma.message.findMany({
            where: {
                conversationId: conversationId
            },
            orderBy: { 
                createdAt: 'desc' 
            },
            ...(cursor && {
                cursor: {
                    id: cursor
                }
            }),
            // cursor: cursor ? { id: cursor } : undefined,
            take: limit, 
            skip: cursor ? 1 : 0,
            include: {
                sender: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        image: true,
                    },
                },
                seen: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
                conversation: {
                    select:{
                        isGroup: true,
                        userIds: true
                    }
                },
                readStatuses: { 
                    where: { 
                        userId: user.id
                    } 
                }
            },
        });

        const nextCursor = messages.length === limit ? messages[messages.length - 1].id : null;

        return NextResponse.json({ messages, nextCursor }, {status: 200});
    } catch (error) {
        return NextResponse.json({message: "해당 대화방을 불러오지 못했습니다."})
    }
}