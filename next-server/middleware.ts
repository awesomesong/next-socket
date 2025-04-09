// export { default } from "next-auth/middleware";
// import { withAuth } from "next-auth/middleware"
import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET;

export async function middleware(req: NextRequest) {
    const token = await getToken({ req });
    const url = req.nextUrl.clone();
    const { pathname, searchParams, origin } = url;

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
        "/blogs/:id/edit",
        "/posts/create",
        "/posts/:id/edit",
    ]
}
