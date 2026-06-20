"use client";

import { Logo } from "./logo";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full  dark:border-zinc-900/40 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md border-b border-red-300/30">
      <div className="w-full max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Logo />

        {/* Actions (Sign In / Sign Up) */}
        <div className="flex items-center gap-4">
          <a 
            href="/login" 
            className="text-sm font-medium text-neutral-600 hover:text-black dark:text-neutral-300 dark:hover:text-white px-3 py-2 transition duration-200"
          >
            Sign In
          </a>
          <button className="text-sm font-medium px-4.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-black rounded-full shadow transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer">
            Sign Up
          </button>
        </div>
      </div>
    </header>
  );
}
