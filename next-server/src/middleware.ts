import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const secret = process.env.NEXTAUTH_SECRET;

export async function middleware(req: NextRequest) {
  // NextAuth JWT 쿠키는 환경/스킴(https 여부)에 따라 secure prefix가 달라집니다.
  // 예) https면 `__Secure-next-auth.session-token`, http면 `next-auth.session-token`
  // 미들웨어에서는 env 기반 추정이 어긋나면 토큰을 못 읽고 로그인으로 리다이렉트될 수 있어
  // 두 쿠키 이름을 모두 시도합니다.
  const token =
    (await getToken({
      req,
      secret,
      cookieName: "__Secure-next-auth.session-token",
      secureCookie: true,
    }).catch(() => null)) ??
    (await getToken({
      req,
      secret,
      cookieName: "next-auth.session-token",
      secureCookie: false,
    }).catch(() => null));
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
