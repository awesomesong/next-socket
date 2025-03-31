import prisma from '../../../../prisma/db';
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from '../../lib/session';

export async function GET( req: NextRequest ){

    const limit = 24;
    const searchParams  = req.nextUrl.searchParams.get('cursor');
    const cursor = searchParams ? searchParams : null;

    try {
        // Prisma ORM
        const blogPosts = await prisma.blog.findMany({
            orderBy: [
                { createdAt: 'desc' },
                { id: 'desc'},
            ],
            ...(cursor && {
                cursor: {
                    id: cursor
                }
            }),
            take: limit,
            skip: cursor ? 1 : 0,
            select: {
                id: true,
                title: true,
                image: true,
                createdAt: true,
                author: {
                    select: {
                        name: true,
                        image: true,
                    },
                },
                _count: {
                    select: { 
                        comments: true 
                    }
                },
                viewCount: true
            },
        });

        return NextResponse.json({blogPosts}, {status: 200});

    } catch(error){
        return NextResponse.json({message: '블로그에 대한 내용을 찾지 못했습니다.'}, { status: 500 });
    }
};

export async function POST(req: Request){
    const user = await getCurrentUser();

    try {
        if(!user?.email) {
            return NextResponse.json({ message: '로그인 후에 글을 작성해주세요.'}, { status: 401 })
        }

        
        const { title, content, image } = await req.json();

        if(title === '') return NextResponse.json({ message: '제목을 입력해주세요.'}, { status: 401 });
        if(content === '') return NextResponse.json({ message: '글을 입력해주세요.'}, { status: 401 });
       
        const newBlog = await prisma.blog.create({
            data: {
                title,
                content,
                image: image,
                authorEmail: user.email,
            },
        });

        const response = NextResponse.json({newBlog}, {status: 200});

        if(newBlog.id) {
            // 작성자는 방문 기록이 저장되지 않도록, 쿠키에 방문 기록 저장
            const visitedBlogPages = [newBlog.id];

            response.cookies.set(
                `visitedBlogPages-${newBlog.id}`,
                JSON.stringify(visitedBlogPages),
                {
                    httpOnly: true,
                    maxAge: 60 * 60 * (24 +9), // 1일 동안 유지 (UTC를 9시간 추가해서 KST로 변경)
                    path: '/',
                }
            );
        }
        return response;

    } catch(error){
        return NextResponse.json({message: 'Something went wrong!'}, { status: 500 });
    }
}