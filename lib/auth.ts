import { getServerSession } from "next-auth/next"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { compare } from "bcryptjs"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import type { DefaultSession, NextAuthOptions } from "next-auth"
import prisma from "@/lib/prisma"
import type { Role, UserStatus } from "@prisma/client"

// Extend the built-in session types
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: Role;
      status: UserStatus;
      mustChangePassword: boolean;
    } & DefaultSession["user"];
  }
}

/**
 * How long account state may be stale inside a JWT before it is re-read.
 *
 * The token lives for days, so deactivating an admin would otherwise have no
 * effect until it expired. This bounds that window for *middleware* decisions;
 * API routes never rely on it at all — `requireActiveUser()` reads the database
 * on every call, so a revoked account loses API access immediately regardless.
 */
const ACCOUNT_STATE_TTL_MS = 60_000;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password");
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            image: true,
            status: true,
            mustChangePassword: true,
          },
        });

        if (!user || !user.password) {
          throw new Error("No account found with this email");
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        // Checked after the password so the error can't be used to probe which
        // accounts exist and are disabled.
        if (user.status === "INACTIVE") {
          throw new Error(
            "This account has been deactivated. Contact your administrator."
          );
        }

        // PENDING accounts are allowed through on purpose: they still have to
        // reach /auth/set-password, and middleware pins them there.
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
          status: user.status,
          mustChangePassword: user.mustChangePassword,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }: { token: any; user: any; trigger?: string }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status ?? "ACTIVE";
        token.mustChangePassword = user.mustChangePassword ?? false;
        token.stateCheckedAt = Date.now();
        return token;
      }

      // Re-read account state periodically, and immediately whenever the client
      // calls `useSession().update()` — which the set-password flow does, so the
      // user stops being pinned to the password screen the moment they finish
      // rather than after the TTL elapses.
      const stale =
        Date.now() - (token.stateCheckedAt ?? 0) > ACCOUNT_STATE_TTL_MS;

      if (token.id && (stale || trigger === "update")) {
        const account = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, status: true, mustChangePassword: true },
        });

        if (account) {
          token.role = account.role;
          token.status = account.status;
          token.mustChangePassword = account.mustChangePassword;
        } else {
          // Account deleted while the session was live — mark it unusable so
          // middleware stops honouring the token.
          token.status = "INACTIVE";
        }
        token.stateCheckedAt = Date.now();
      }

      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session?.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.status = (token.status ?? "ACTIVE") as UserStatus;
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user
}

export async function isAuthenticated() {
  const session = await getSession()
  return !!session
}

export async function hasRole(role: Role) {
  const user = await getCurrentUser()
  return user?.role === role
}
