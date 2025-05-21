export const runtime = "nodejs";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import prisma from "@/lib/prisma";

const isDev = process.env.NODE_ENV === "development";
const isProd = process.env.NODE_ENV === "production";

function getStudentID(email: string) {
  return email.slice(0, 6);
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async signIn({ user }) {
      // CredentialsProvider 일 경우 user.email 존재하지 않을 수 있음
      // 따라서, studentNo로 우선 확인
      const studentNo = user.email?.slice(0, 6) ?? "";
      const isKsaMail = user.email?.endsWith("@ksa.hs.kr") ?? false;

      // Google 로그인은 항상 이메일 검사!
      if (user.email && !isKsaMail) return false;

      // CredentialsProvider로 들어온 유저는 studentNo로 처리
      if (!studentNo) return false;

      let dbUser = await prisma.user.findUnique({ where: { studentNo } });
      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            studentNo: studentNo,
            name: user.name ?? "unknown",
          },
        });
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        const dbUser = await prisma.user.findUnique({
          where: { studentNo: getStudentID(session.user.email!) },
        });
        session.user.id = dbUser?.id;
      }
      return session;
    },
  },

  ...(isProd && {
    pages: {
      signIn: "/login",
      error: "/login",
    },
  }),
};
