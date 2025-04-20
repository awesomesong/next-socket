import prisma from '../../../../../prisma/db';
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/src/app/lib/session";

type ParamsProp = {
    params: {
        id: string;
    }
}

export async function GET(req: Request, { params }: ParamsProp){
    const { id: blogId } = params;

    try {
        const blog = await prisma.blog.findFirst({
            where: {
                id: blogId
            },
            select: {
                id: true,
                title: true,
                content: true,
                image: true,
                authorEmail: true,
                createdAt: true,
                author: {
                    select: {
                        name: true,
                        email: true,
                        image: true,
                    }
                },
                _count: {
                    select: {
                        comments: true
                    }
                },
                viewCount: true,
            }
        });
    
        return NextResponse.json({blog}, { status: 200 });

    } catch(error) {
        return NextResponse.json({message: '해당 글을 불러오지 못했습니다.'}, { status: 500 });
    }
}

export async function DELETE(req: Request,  { params }: ParamsProp) {
    const user = await getCurrentUser();
    const { id: blogId } = params;

    try {
        if(!user?.email) {
            return NextResponse.json({ message: '로그인 후에 삭제를 할 수 있습니다.'}, { status: 401 })
        }

        const blog = await prisma.blog.findUnique({
            where: { id: params.id },
        });

        if(!blog) {
            return NextResponse.json({message: '해당 글을 찾을 수 없습니다.'}, { status: 404 });
        }

        const result = await prisma.blog.deleteMany({ 
            where: { 
                id: blogId
            },
        });

        return NextResponse.json({message: '해당 글을 삭제하였습니다.'}, { status: 200 });

    } catch(error) {
        return NextResponse.json({message: '오류가 발생하여, 해당 글을 삭제하지 못했습니다.'}, { status: 500 });
    }
}


export async function PUT(req: Request, { params }: ParamsProp){
    const user = await getCurrentUser();
    const { id: blogId } = params;

    try {
        if(!user?.email) {
            return NextResponse.json({ message: '로그인 후에 수정을 할 수 있습니다.'}, { status: 401 })
        }

        const blog = await prisma.blog.findUnique({
            where: { id: blogId },
            select: { authorEmail: true },
        });
      
        if (!blog) {
            return NextResponse.json({ message: '존재하지 않는 블로그입니다.' }, { status: 404 });
        }
      
        if (blog.authorEmail !== user.email) {
            return NextResponse.json({ message: '해당 글을 수정할 권한이 없습니다.' }, { status: 403 });
        }

        const { title, content, image } = await req.json();

        const updateBlog = await prisma.blog.update({
            where: {
                id: blogId
            },
            data: {
                title,
                content,
                image,
                authorEmail: user.email,
                updatedAt: new Date(),
            }
        });
        return NextResponse.json({updateBlog}, {status: 200});

    } catch(error){
        return NextResponse.json({message: 'Something went wrong!'}, { status: 500 });
    }
}