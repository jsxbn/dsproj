export const runtime = "nodejs";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";

function getStudentID(email: string) {
  return email.slice(0, 6);
}

export const authOptions: NextAuthOptions = {
  // 개발 모드에만 debug 찍고 싶다면

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  // production 에선 NEXTAUTH_SECRET 이 무조건 필요합니다
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    // 이메일 도메인 검사
    async signIn({ user }) {
      const isKsaMail = user.email?.endsWith("@ksa.hs.kr") ?? false;
      if (!isKsaMail) return false;
      const studentNo = user.email!.slice(0, 6);
      let dbUser = await prisma.user.findUnique({ where: { studentNo } });
      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            studentNo: studentNo,
            name: user.name ?? "unknown", // user.name이 없는 경우 fallback
          },
        });
      }
      return true;
    },
    async session({ session }) {
      if (session.user) {
        const dbUser = await prisma.user.findUnique({
          where: { studentNo: getStudentID(session.user.email!) },
        });
        session.user.id = dbUser?.id;
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
};
