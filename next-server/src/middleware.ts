import { NextResponse, NextRequest } from "next/server";
import { getToken, decode } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;

  // raw: true로 쿠키 이름을 명시해서 읽음 (auto-detection은 Edge Runtime에서 NEXTAUTH_URL을 못 읽어 이름 불일치 발생)
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

  // 읽은 raw JWT를 직접 디코딩 (getToken 기본 호출의 쿠키 이름 auto-detection 우회)
  const rawToken = rawSecure ?? rawInsecure;
  const token =
    rawToken && secret
      ? await decode({ token: rawToken, secret }).catch(() => null)
      : null;

  if (!token) {
    const signin = new URL("/auth/signin", req.nextUrl.origin);
    signin.searchParams.set("callbackUrl", req.nextUrl.pathname);

    const allCookies = req.cookies.getAll();
    const sessionTokenCookies = allCookies
      .map((c) => c.name)
      .filter((name) => name.includes("session-token"));
    // 전체 쿠키 이름 목록 (쿠키가 아예 없는지 vs 이름이 다른지 확인용)
    const allCookieNames = allCookies.map((c) => c.name).slice(0, 10);

    signin.searchParams.set("mw", "1");
    signin.searchParams.set("rawS", rawSecure ? "1" : "0");
    signin.searchParams.set("rawI", rawInsecure ? "1" : "0");
    signin.searchParams.set("secret", secret ? "1" : "0");
    signin.searchParams.set("host", req.nextUrl.host);
    signin.searchParams.set("reason", !rawSecure && !rawInsecure ? "no_cookie" : "decode_failed");
    signin.searchParams.set(
      "sessionTokenCookies",
      sessionTokenCookies.join("|") || "none"
    );
    signin.searchParams.set(
      "allCookies",
      allCookieNames.join("|") || "empty"
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
