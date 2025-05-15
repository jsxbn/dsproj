// app/layout.tsx
"use client";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import theme from "../theme"; // 위에서 만든 테마
import { ReactNode, Suspense } from "react";
import localFont from "next/font/local";
import CssBaseline from "@mui/material/CssBaseline";
import { GlobalStyles } from "@mui/material";
import { SessionProvider } from "next-auth/react";
import NavigationBar from "@/components/Navbar";

const pretendard = localFont({
  src: "../fonts/PretendardVariable.woff2",
  display: "swap",
  weight: "45 920",
  variable: "--font-pretendard",
});

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className={`${pretendard.variable}`}>
        <SessionProvider>
          <AppRouterCacheProvider>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <GlobalStyles
                styles={{
                  body: {
                    fontFamily: `var(--font-pretendard), -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif`,
                  },
                }}
              />
              <NavigationBar></NavigationBar>
              <div id="modal-root"></div>
              <Suspense>{children}</Suspense>
            </ThemeProvider>
          </AppRouterCacheProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
