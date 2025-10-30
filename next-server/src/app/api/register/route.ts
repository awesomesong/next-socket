import bcrypt from 'bcryptjs';
import prisma from '@/prisma/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request){
    try{
        const { email, name, password } = await req.json();

        if(!email) return NextResponse.json({message : "이메일을 입력해주세요."}, {status: 400});
        if(!name) return NextResponse.json({message : "이름을 입력해주세요."}, {status: 400});
        if(!password) return NextResponse.json({message : "비밀번호를 입력해주세요."}, {status: 400});

        // ✅ 이메일 형식 검증 (클라이언트와 동일한 정책)
        const emailRegex = /^[\w.-]+@(?:gmail\.com|naver\.com|daum\.net|hanmail\.net|nate\.com|outlook\.com|yahoo\.com)$/i;
        if (!emailRegex.test(email)) {
            return NextResponse.json({message: "지원하는 이메일 서비스를 사용해주세요."}, {status: 400});
        }

        // ✅ 비밀번호 검증 (클라이언트와 동일한 정책)
        if (password.length < 8) {
            return NextResponse.json({message: "비밀번호는 최소 8자 이상이어야 합니다."}, {status: 400});
        }
        const passwordRegex = /^(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return NextResponse.json({message: "영문자, 숫자, 특수문자(@$!%*?&)를 포함한 8자리 이상이어야 합니다."}, {status: 400});
        }

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

        // ✅ 새 사용자 등록 시 Socket.IO 서버로 HTTP POST 알림
        try {
            const socketServerUrl = process.env.SOCKET_SERVER_URL || 'https://socket-server-muddy-shadow-6983.fly.dev';
            const notifyUrl = `${socketServerUrl}/api/user-registered`;
            
            const response = await fetch(notifyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-webhook-secret': process.env.WEBHOOK_SECRET || '',
                },
                body: JSON.stringify({
                    userId: user.id,
                    useremail: user.email,
                    name: user.name,
                    createdAt: user.createdAt
                })
            });

            if (response.ok) {
                console.log(`[Register API] ✅ Socket.IO 서버 알림 전송 성공: ${user.name}`);
            } else {
                console.error(`[Register API] ❌ Socket.IO 서버 알림 전송 실패: ${response.status} ${response.statusText}`);
            }
        } catch (httpError: any) {
            console.error(`[Register API] ❌ HTTP 알림 전송 실패:`, httpError);
        }

        return NextResponse.json({message: `${user.name} 계정이 등록되었습니다.`} , {status: 200});
    } catch(error: any){
        console.error('[Register API] Error:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({message: "이미 등록된 이메일입니다."}, {status: 409});            
        }
        return NextResponse.json({message: "계정을 생성하지 못했습니다."}, {status: 500});
    }
}