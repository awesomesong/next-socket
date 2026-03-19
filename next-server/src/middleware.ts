import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  // NOTE:
  // Next.js middleware는 기본 런타임이 edge라서, process.env 값이 빌드 시점에 인라인될 수 있습니다.
  // 운영 배포 환경에서 NEXTAUTH_SECRET이 미들웨어 번들에 제대로 주입되지 않으면
  // getToken() 디코드가 실패해서 token=null -> /auth/signin 리다이렉트 루프가 발생할 수 있습니다.
  // 그래서 런타임을 nodejs로 전환하고, secret은 미들웨어 실행 시점에 읽습니다.
  const secret = process.env.NEXTAUTH_SECRET;

  // NextAuth JWT 쿠키는 환경/스킴(https 여부)에 따라 secure prefix가 달라집니다.
  // 예) https면 `__Secure-next-auth.session-token`, http면 `next-auth.session-token`
  // 미들웨어에서는 env 기반 추정이 어긋나면 토큰을 못 읽고 로그인으로 리다이렉트될 수 있어
  // 두 쿠키 이름을 모두 시도합니다.

  // 1) 먼저 raw JWT를 읽을 수 있는지 확인(디코딩 실패 여부와 분리)
  const rawTokenSecure =
    (await getToken({
      req,
      secret,
      raw: true,
      cookieName: "__Secure-next-auth.session-token",
      secureCookie: true,
    }).catch(() => null)) ?? null;

  const rawTokenInsecure =
    (await getToken({
      req,
      secret,
      raw: true,
      cookieName: "next-auth.session-token",
      secureCookie: false,
    }).catch(() => null)) ?? null;

  // 쿠키 자체가 없으면 로그인으로 리다이렉트
  if (!rawTokenSecure && !rawTokenInsecure) {
    const signin = new URL("/auth/signin", req.nextUrl.origin);
    signin.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(signin);
  }

  // 2) raw JWT는 읽혔지만, secret로 디코딩이 실패하면 token이 null이 됩니다.
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
    console.error("[auth-middleware] session cookie exists but token decode failed", {
      hasRawSecure: Boolean(rawTokenSecure),
      hasRawInsecure: Boolean(rawTokenInsecure),
      secretPresent: Boolean(secret),
      url: req.nextUrl.toString(),
    });
    const signin = new URL("/auth/signin", req.nextUrl.origin);
    signin.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(signin);
  }
  return NextResponse.next();
}

/** 로그인 필수 경로 — 여기만 수정하면 됨 (matcher에만 적용) */
export const config = {
  // middleware 기본값(edge) 대신 nodejs 사용:
  // 운영에서 NEXTAUTH_SECRET이 빌드 시점에 주입되지 않아 디코드 실패하는 문제 방지
  runtime: "nodejs",
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
