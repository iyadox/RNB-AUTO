/**
 * Redirection rapide vers la page de connexion quand aucun cookie de session n'est présent.
 * Ce n'est qu'un confort : la vraie vérification est faite dans chaque page et chaque action.
 */
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ADMIN_PATHS = ["/admin/connexion", "/admin/installation"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC_ADMIN_PATHS.some((path) => pathname.startsWith(path))) return NextResponse.next();
  const hasCookie = request.cookies.has("__Host-rnb_session") || request.cookies.has("rnb_session");
  if (!hasCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/connexion";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
