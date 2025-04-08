"use client";

import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";
import DarkModeToggle from "./DarkModeToggle";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              prefetch={false}
              className="flex items-center space-x-2 hover:opacity-90 transition-opacity"
            >
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">
                Escuela de Ministerio Sobrenatural
              </span>
            </Link>

            {/* <SearchInput /> */}
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <DarkModeToggle />

            <SignedIn>
              <UserButton />
            </SignedIn>

            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="outline" size="default">
                  Sign In
                </Button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </div>
    </header>
  );
}
