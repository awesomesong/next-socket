// export { default } from "next-auth/middleware";
// import { withAuth } from "next-auth/middleware"
import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET;

export async function middleware(req: NextRequest) {
    const token = await getToken({ req, secret, raw: false });
    const url = req.nextUrl.clone();
    const { pathname, searchParams, origin } = url;

    // 인증 없이 접근 가능한 경로
    const publicPaths = ["/auth/signin", "/register"];

    // public 경로인 경우 미들웨어 패스
    if (publicPaths.some(path => pathname.startsWith(path))) {
        return NextResponse.next();
    }

    if(!!token === false) {
        const queryString = searchParams.toString();
        const fullPath = `${pathname}${queryString ? `?${queryString}` : ''}`;
        
        const signinUrl = new URL('/auth/signin', origin);
        signinUrl.searchParams.set('callbackUrl', fullPath);
    
        return NextResponse.redirect(signinUrl);
    }
}

export const config = {
    matcher: [
        "/chatMember/:path*",
        "/conversations/:path*",
        "/profile",
        "/blogs/create",
        "/posts/create"
    ]
}
