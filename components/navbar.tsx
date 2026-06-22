"use client";

import { signOut, useSession } from "next-auth/react";
import { Logo } from "./logo";

import Link from "next/link";
import Image from "next/image";

export function Navbar() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full dark:border-zinc-900/40 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md border-b border-red-300/30">
      <div className="w-full max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Logo />

        {/* Actions (Sign In / Sign Out / Loading Skeleton) */}
        <div className="flex items-center gap-4">
          {status === "loading" ? (
            <>
              <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
              <div className="w-20 h-9 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            </>
          ) : status === "authenticated" && session ? (
            <>
              {session.user?.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || "User profile"}
                  width={32}
                  height={32}
                  className="rounded-full border border-neutral-200 dark:border-neutral-800"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-600 dark:text-neutral-300">
                  {session.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                </div>
              )}
              <button
                onClick={() => signOut()}
                className="text-sm font-medium px-4.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-black rounded-full shadow transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/auth/signin"
              className="text-sm font-medium px-4.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-black rounded-full shadow transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
