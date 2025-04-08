import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { SanityLive } from "@/sanity/lib/live";
import Header from "@/components/Header";
import { ClerkProvider } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Escuela Ministerio Sobrenatural",
  description: "Escuela del Ministerio Sobrenatural",
};

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 pt-16">{children}</main>
        </div>
      </ThemeProvider>

      <SanityLive />
    </ClerkProvider>
  );
}
