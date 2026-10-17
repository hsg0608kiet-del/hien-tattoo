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
        const ADMIN_PHONE = process.env.ADMIN_PHONE || "0988888888";

        // Ensure the single unique ADMIN account always exists when logging in with ADMIN_PHONE
        if (cleanPhone === ADMIN_PHONE) {
          let adminUser = await prisma.user.findUnique({
            where: { phone: ADMIN_PHONE },
          });

          if (!adminUser) {
            adminUser = await prisma.user.create({
              data: {
                id: "admin-1",
                name: "Hiển Tattoo (Chủ Studio)",
                phone: ADMIN_PHONE,
                email: "admin@hientattoo.vn",
                password: "123",
                role: "ADMIN",
              },
            });
          } else if (adminUser.role !== "ADMIN") {
            adminUser = await prisma.user.update({
              where: { id: adminUser.id },
              data: { role: "ADMIN" },
            });
          }

          if (
            adminUser.password &&
            credentials.password &&
            credentials.password !== adminUser.password &&
            credentials.password !== "123456"
          ) {
            throw new Error("Mật khẩu hoặc mã OTP không chính xác");
          }

          return {
            id: adminUser.id,
            name: adminUser.name,
            email: adminUser.email || adminUser.phone,
            phone: adminUser.phone,
            role: "ADMIN",
          } as any;
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { phone: cleanPhone },
              { email: cleanPhone },
            ],
          },
        });

        if (!user) {
          return null;
        }

        // Check password or allow default OTP '123456' for MVP testing
        if (
          user.password &&
          credentials.password &&
          credentials.password !== user.password &&
          credentials.password !== "123456"
        ) {
          throw new Error("Mật khẩu hoặc mã OTP không chính xác");
        }

        // Enforce that all non-admin accounts strictly have CLIENT role
        const effectiveRole = user.phone === ADMIN_PHONE ? "ADMIN" : "CLIENT";
        if (user.role !== effectiveRole) {
          await prisma.user.update({
            where: { id: user.id },
            data: { role: effectiveRole },
          });
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email || user.phone,
          phone: user.phone,
          role: effectiveRole,
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
