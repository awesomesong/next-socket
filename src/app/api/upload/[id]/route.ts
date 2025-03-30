import prisma from '../../../../../prisma/db';
import { getCurrentUser } from "@/src/app/lib/session";
import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

type ParamsProp = {
    params: {
        id: string;
    }
}

export async function GET(
    req: Request, 
    { params }: ParamsProp
){
    const user = await getCurrentUser();  
    const { id: filesId } = params;

    try {
        // if(!user?.email) {
        //     return NextResponse.json({ message: '로그인 후에 확인할 수 있습니다.'}, { status: 401 })
        // }
        
        const files = await prisma.files.findMany({
            where: {
                filesId: filesId
            },
        });

        // const file = await fs.readFile(process.cwd() + files[0].file);
    
        return NextResponse.json({files}, { status: 200 });

    } catch(error) {
        return NextResponse.json({message: '해당 글의 파일을 불러오지 못했습니다.'}, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: ParamsProp
){
    try {
        const { id: filesId } = params;
        const absolutePath = path.join(process.cwd(), `public/uploads/${filesId}`);
        await fs.rm(absolutePath, { recursive: true });

        return NextResponse.json({message: '파일을 삭제하였습니다.'}, { status: 200 });
    } catch(error) {
        return NextResponse.json({message: '해당 글의 파일을 삭제하지 못했습니다.'}, { status: 500 });
    }
}