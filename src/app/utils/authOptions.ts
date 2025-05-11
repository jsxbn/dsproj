export const runtime = "nodejs";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  // 개발 모드에만 debug 찍고 싶다면
  debug: process.env.NODE_ENV === "development",

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
      // user: User, account: Account|null, profile?: Profile, email?:{verificationRequest?:boolean}, credentials?:Record<string,any>
      return user.email?.endsWith("@ksa.hs.kr") ?? false;
    },
  },

  // App-router 에선 pages 옵션이 동작하긴 하는데
  // 만약 제대로 리다이렉트 안 된다면, 아래 설정 빼고
  // 로그인/에러 페이지에서 next-auth 에서 넘겨주는 오류를 직접 처리해 주세요
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
