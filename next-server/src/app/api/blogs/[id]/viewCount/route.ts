import prisma from '../../../../../../prisma/db';
import { NextRequest, NextResponse } from "next/server";

interface IParams {
    id?: string;
}

export async function POST(
    req: NextRequest,
    { params }: { params : Promise<IParams>},
){
    const { id } = await params;

    // 쿠키에서 방문 기록 가져오기
    const cookies = req.cookies.get(`visitedBlogPages-${id}`);
    const visitedBlogPages = cookies?.value ? JSON.parse(cookies.value) : [];

    if (visitedBlogPages.includes(id)) {
        // 이미 방문한 페이지는 조회수를 증가시키지 않음
        return NextResponse.json({ message: 'Already visited', viewCountIncremented: false}, 
                                {status: 200});
    }
    
    try {
        const blog = await prisma.blog.findUnique({
            where: { id: id },
            select: { viewCount: true },
        });
      
        if (!blog) {
            return NextResponse.json({message: '해당 블로그의 글을 찾지 못했습니다.'}, {status: 200});
        }


        const addedBlogViewCount = await prisma.blog.update({
            where: {
                id: id,
            },
            data: {
                viewCount: blog.viewCount === 0 
                ? { set: 1 } 
                : { increment: 1 },
            },
            select: {
                viewCount: true
            }
        });

        // 쿠키에 방문 기록 저장
        visitedBlogPages.push(id);
        const response = NextResponse.json({ 
                                message: 'View count incremented', 
                                viewCountIncremented: true,
                                addedBlogViewCount, 
                            },
                            { status: 200 }
                        );
        response.cookies.set(
            `visitedBlogPages-${id}`,
            JSON.stringify(visitedBlogPages),
            {
                httpOnly: true,
                maxAge: 60 * 60 * (24 +9), // 1일 동안 유지
                path: '/',
            }
        );

        return response;
    } catch {
        return NextResponse.json({message: 'Something went wrong!'}, { status: 500 });
    }
}
