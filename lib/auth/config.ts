import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getUserByEmail, getUserById, verifyPassword, recordLogin } from "./users";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "E-Mail & Passwort",
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().trim();
        const password = credentials?.password?.toString();
        if (!email || !password) return null;

        const user = await getUserByEmail(email);
        if (!user) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        await recordLogin(user.id, user.email);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 Tage
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Beim Login: Werte aus dem authorize()-Ergebnis uebernehmen.
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
        token.organizationId = user.organizationId;
      } else if (token.id) {
        // Bei jedem weiteren Request: Rolle/Org frisch aus der DB lesen, damit
        // Rollenaenderungen (z.B. Hochstufung zum Admin) SOFORT greifen, ohne
        // dass sich der Nutzer neu anmelden muss. So sehen Admins immer alles.
        const fresh = await getUserById(token.id as string);
        if (fresh) {
          token.email = fresh.email;
          token.role = fresh.role;
          token.organizationId = fresh.organizationId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.role = token.role;
        session.user.organizationId = token.organizationId;
      }
      return session;
    },
  },
};
