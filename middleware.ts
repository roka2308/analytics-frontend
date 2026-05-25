export { default } from "next-auth/middleware";

export const config = {
  // /setup, /login und / sind öffentlich – alle anderen Routen geschützt.
  matcher: ["/dashboard/:path*", "/settings/:path*"],
};
