export { default } from "next-auth/middleware";

export const config = {
  /*
   * Geschuetzte Routen. Alles andere ist oeffentlich:
   *  - /                Landing-Seite
   *  - /login, /setup   Auth-Flow
   *  - /share/[token]   Read-Only-Sharing (Phase K) – bewusst public
   *
   * Defense-in-Depth: Server-Components rufen zusaetzlich requireUser auf,
   * aber die middleware sorgt schon vorher fuer Redirect zum Login.
   */
  matcher: ["/dashboard/:path*", "/settings/:path*", "/projekte/:path*"],
};
