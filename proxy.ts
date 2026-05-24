import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin/dashboard")) {
    const token = req.cookies.get("admin_token")?.value;
    if (token !== process.env.ADMIN_TOKEN_SECRET) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/dashboard/:path*"] };
