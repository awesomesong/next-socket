import { NextResponse, NextRequest } from "next/server";
import { decode } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;

  // getToken/SessionStore 우회: req.cookies.get()으로 직접 읽기
  const rawSecure =
    req.cookies.get("__Secure-next-auth.session-token")?.value ?? null;
  const rawInsecure =
    req.cookies.get("next-auth.session-token")?.value ?? null;

  const rawToken = rawSecure ?? rawInsecure;
  const token =
    rawToken && secret
      ? await decode({ token: rawToken, secret }).catch(() => null)
      : null;

  if (!token) {
    const signin = new URL("/auth/signin", req.nextUrl.origin);
    signin.searchParams.set("callbackUrl", req.nextUrl.pathname);

    const allCookies = req.cookies.getAll();
    const allCookieNames = allCookies.map((c) => c.name).slice(0, 10);

    signin.searchParams.set("mw", "1");
    signin.searchParams.set("rawS", rawSecure ? "1" : "0");
    signin.searchParams.set("rawI", rawInsecure ? "1" : "0");
    signin.searchParams.set("secret", secret ? "1" : "0");
    signin.searchParams.set("host", req.nextUrl.host);
    signin.searchParams.set("reason", !rawSecure && !rawInsecure ? "no_cookie" : "decode_failed");
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
