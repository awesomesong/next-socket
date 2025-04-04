// export { default } from "next-auth/middleware";
// import { withAuth } from "next-auth/middleware"
import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET;

export async function middleware(req: NextRequest) {
    const token = await getToken({ req, secret, raw: false });
    const url = req.nextUrl.clone();
    const { pathname, searchParams } = url;

    if(!!token === false) {
        const callbackUrl = pathname.length > 0 && `?callbackUrl=${pathname}${searchParams.toString() && '?'+searchParams.toString()}`;
        
        return NextResponse.redirect(new URL(`/auth/signin${callbackUrl}` , req.url));
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
