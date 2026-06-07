import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: "admin" | "creator" | "viewer";
      organizationId: string | null;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string | null;
    role: "admin" | "creator" | "viewer";
    organizationId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    role: "admin" | "creator" | "viewer";
    organizationId: string | null;
  }
}
