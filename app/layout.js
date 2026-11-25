import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import SettingsMenu from "@/components/settings-menu";
import ToastProvider from "@/components/toast-provider";
import ThemeSwitcher from "@/components/theme-switcher";
import { DEFAULT_THEME, THEME_STORAGE_KEY } from "@/lib/themes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Resumestan",
  description: "Import your Canva resumes and get ATS analysis, recommendations and guides.",
  icons: {
    icon: ["/logo.svg"],
  },
};

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const theme = cookieStore.get(THEME_STORAGE_KEY)?.value || DEFAULT_THEME;
  return (
    <html
      lang="en"
      data-theme={theme}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-white">
        <ToastProvider />
        {children}
        <SettingsMenu />
      </body>
    </html>
  );
}
