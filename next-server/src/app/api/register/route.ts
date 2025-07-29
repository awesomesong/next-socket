import bcrypt from 'bcryptjs';
import prisma from '@/prisma/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request){
    try{
        const { email, name, password } = await req.json();

        if(!email) return NextResponse.json({message : "이메일을 입력해주세요."}, {status: 400});
        if(!name) return NextResponse.json({message : "이름을 입력해주세요."}, {status: 400});
        if(!password) return NextResponse.json({message : "비밀번호를 입력해주세요."}, {status: 400});

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                email,
                name,
                hashedPassword,
                role: 'user',
                provider: 'credentials'
            }
        });

        return NextResponse.json({message: `${user.name} 계정이 등록되었습니다.`} , {status: 200});
    } catch(error: any){
        console.log('REGISTRATION_ERROR', error);
        if (error.code === 'P2002') {
            return NextResponse.json({message: "등록된 계정입니다."}, {status: 500});            
        }
        return NextResponse.json({message: "계정을 생성하지 못했습니다."}, {status: 500});
    }
}