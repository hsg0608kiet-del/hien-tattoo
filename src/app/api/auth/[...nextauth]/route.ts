import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "@/lib/prisma"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "customer1@example.com" },
        password: { label: "Password (any)", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        
        // For MVP testing, password is not checked strictly
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (user) {
          return { id: user.id, name: user.name, email: user.email, role: user.role };
        }
        
        return null;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: "jwt",
  }
})

export { handler as GET, handler as POST }
