import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/auth/login", "/auth"];
// Rutas accesibles siempre, tenga o no token: nunca se redirigen en ningun sentido.
const ALWAYS_ALLOWED_ROUTES = ["/protected"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  if (ALWAYS_ALLOWED_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  if (!isPublicRoute && !token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (isPublicRoute && token) {
    return NextResponse.redirect(new URL("/institucional", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|img|assets|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2|ttf|eot|ico|map)$).*)",
  ],
};
