import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "PhoneCredentials",
      credentials: {
        phone: { label: "Số điện thoại", type: "text", placeholder: "0901234567" },
        password: { label: "Mật khẩu / OTP", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.phone) return null;

        const cleanPhone = credentials.phone.trim();

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { phone: cleanPhone },
              { email: cleanPhone }, // Fallback support if someone enters email
            ],
          },
        });

        if (!user) {
          return null;
        }

        // Check password or allow default OTP '123456' / '123' for MVP testing
        if (
          user.password &&
          credentials.password &&
          credentials.password !== user.password &&
          credentials.password !== "123456"
        ) {
          throw new Error("Mật khẩu hoặc mã OTP không chính xác");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email || user.phone,
          phone: user.phone,
          role: user.role,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.phone = (user as any).phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).phone = token.phone;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "hien-tattoo-super-secret-key-2026",
};
