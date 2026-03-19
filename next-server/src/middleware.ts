import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  const token = await getToken({ req, secret }).catch(() => null);

  if (!token) {
    const signin = new URL("/auth/signin", req.nextUrl.origin);
    signin.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(signin);
  }
  return NextResponse.next();
}

/** 로그인 필수 경로 — 여기만 수정하면 됨 (matcher에만 적용) */
export const config = {
  matcher: [
    "/chatMember",
    "/chatMember/:path*",
    "/conversations",
    "/conversations/:path*",
    "/profile",
    "/fragrance/create",
    "/fragrance/:id/edit",
    "/notice/create",
    "/notice/:id/edit",
  ],
};
