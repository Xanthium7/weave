"use client";
import { Navbar } from "@/components/navbar";
import { ChatInput } from "@/components/chat-input";
import { Logo } from "@/components/logo";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-zinc-950 flex flex-col relative text-neutral-900 dark:text-neutral-50 transition-colors duration-300">
      {/* Background Radial Glow */}
      <div className="absolute top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1200px] h-[750px] bg-gradient-to-tr from-rose-500/30 via-orange-400/20 to-transparent rounded-full blur-[180px] pointer-events-none -z-10 animate-pulse-glow" />

      {/* Navbar Component */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center">
        {/* Hero Section */}
        <section className="w-full max-w-[1000px] mx-auto px-6 text-center pt-24 pb-16 flex flex-col items-center">
          {/* Logo Watermark/Shadow in background */}
          <div className="absolute top-[18%] left-1/2 -translate-x-1/2 opacity-[0.02] dark:opacity-[0.05] pointer-events-none select-none -z-20">
            <svg
              viewBox="0 0 100 100"
              fill="currentColor"
              className="w-[300px] h-[300px]"
            >
              <path d="M20 25 L38 75 L50 45 L62 75 L80 25" />
            </svg>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-medium tracking-tight text-neutral-900 dark:text-neutral-50 mb-4 max-w-4xl leading-[1.08] font-sans">
            What do you want to create?
          </h1>

          {/* Subtitle */}
          <p className="text-[17px] md:text-[21px] text-neutral-500 dark:text-neutral-400 font-medium mb-12 max-w-2xl leading-normal">
            Start building with a single prompt. No coding needed.
          </p>

          {/* Prompt input box */}
          <ChatInput />
        </section>

        <section className="w-full max-w-[1200px] mx-auto px-6 py-8 z-10">
          {/* Title */}
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-neutral-900 dark:text-neutral-50 font-sans">
              Consider yourself limitless
            </h2>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-neutral-100 dark:border-zinc-900 bg-white/20 dark:bg-zinc-950/20 py-12 px-6">
        <div className="w-full max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Logo
              iconOnly={true}
              className="opacity-75 hover:opacity-100 transition"
            />
            <span className="text-xs text-neutral-400 font-medium">
              © {new Date().getFullYear()} Weave. All rights reserved.
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="#privacy"
              className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 font-medium transition"
            >
              Privacy Policy
            </a>
            <a
              href="#terms"
              className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 font-medium transition"
            >
              Terms of Service
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                <path d="M9 18c-4.51 2-5-2-7-2" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
