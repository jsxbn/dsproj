export const runtime = "nodejs";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials"; // 추가!
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
    // 개발 환경에서만 CredentialsProvider 추가
    // ...(isDev
    //   ? [
    CredentialsProvider({
      // 로그인 폼에 입력 받을 필드 정의
      name: "Test Account",
      credentials: {
        studentNo: { label: "학생번호", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // 테스트 계정 정보 하드코딩 (여러개 원하면 배열로 가능)
        if (!credentials) return null;
        // NextAuth에 넘길 유저 객체
        return {
          id: "dd",
          name: credentials.studentNo,
          email: `${credentials.studentNo}@ksa.hs.kr`, // 임의 이메일
        };
      },
    }),
    //   ]
    // : []),
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

  // ...(isProd && {
  //   pages: {
  //     signIn: "/login",
  //     error: "/login",
  //   },
  // }),
};
