import prisma from '../../../../prisma/db';
import { getCurrentUser } from "@/src/app/lib/session";
import { NextResponse } from "next/server";

export async function POST(req: Request){
    const user = await getCurrentUser();

    try {
        if(!user?.email) {
            return NextResponse.json({ message: 'Not Authenticated!'}, { status: 401 })
        }

        
        const { title, content } = await req.json();

        if(title === '') return NextResponse.json({ message: '제목을 입력해주세요.'}, { status: 401 });
        if(content === '') return NextResponse.json({ message: '글을 입력해주세요.'}, { status: 401 });

        const newBlog = await prisma.blog.create({
            data: {
                title,
                content,
                authorEmail: user.email
            }
        });
        return NextResponse.json({newBlog}, {status: 200});

    } catch(error){
        return NextResponse.json({message: 'Something went wrong!'}, { status: 500 });
    }
}