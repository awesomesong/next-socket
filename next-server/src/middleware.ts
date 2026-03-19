import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;

  // 디코딩 실패인지(=secret/JWT mismatch) vs 쿠키가 요청에 실리지 않는지(=domain/host mismatch) 분리해서 확인
  const rawSecure =
    (await getToken({
      req,
      secret,
      raw: true,
      cookieName: "__Secure-next-auth.session-token",
      secureCookie: true,
    }).catch(() => null)) ?? null;

  const rawInsecure =
    (await getToken({
      req,
      secret,
      raw: true,
      cookieName: "next-auth.session-token",
      secureCookie: false,
    }).catch(() => null)) ?? null;

  const token = await getToken({ req, secret }).catch(() => null);

  if (!token) {
    const signin = new URL("/auth/signin", req.nextUrl.origin);
    signin.searchParams.set("callbackUrl", req.nextUrl.pathname);

    const sessionTokenCookies = req.cookies
      .getAll()
      .map((c) => c.name)
      .filter((name) => name.includes("session-token"))
      .slice(0, 20);

    signin.searchParams.set("mw", "1");
    signin.searchParams.set("rawS", rawSecure ? "1" : "0");
    signin.searchParams.set("rawI", rawInsecure ? "1" : "0");
    signin.searchParams.set("secret", secret ? "1" : "0");
    signin.searchParams.set("reason", !rawSecure && !rawInsecure ? "no_cookie" : "decode_failed");
    signin.searchParams.set(
      "sessionTokenCookies",
      sessionTokenCookies.join("|") || "none"
    );
    return NextResponse.redirect(signin);
  }
  return NextResponse.next();
}

/** 로그인 필수 경로 — 여기만 수정하면 됨 (matcher에만 적용) */
export const config = {
  // middleware 기본 edge 대신 nodejs로 실행 (운영에서 env/secret 주입 안정화 목적)
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
