"use client";
import { signIn } from "next-auth/react";
import { Logo } from "@/components/logo";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Suspense, useState } from "react";

function SignInContent() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (error) {
      console.error("Sign in failed:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="relative group max-w-[420px] w-full z-10 px-4">
      {/* Glow effect behind the sign-in card */}
      <div className="absolute -inset-16 bg-linear-to-r from-rose-500/25 via-orange-500/15 to-rose-500/25 rounded-[32px] blur-2xl opacity-80 group-hover:opacity-100 transition duration-700 pointer-events-none" />

      {/* Card container */}
      <div className="relative flex flex-col items-center w-full p-8 rounded-[24px] border border-neutral-200/80 dark:border-neutral-800/80 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl shadow-xl transition-all duration-300">
        
        {/* Logo */}
        <div className="mb-8 scale-110">
          <Logo />
        </div>

        {/* Title & Subtitle */}
      
        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center mb-8 max-w-[280px]">
          Sign in to your account to continue building on Weave.
        </p>

        {/* Action Button */}
        <button
          onClick={handleSignIn}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-zinc-900 hover:bg-neutral-50 dark:hover:bg-zinc-800 text-neutral-800 dark:text-neutral-200 font-medium transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <svg
              className="animate-spin h-5 w-5 text-neutral-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="w-full flex items-center justify-center my-6 gap-3">
          <div className="h-px flex-1 bg-neutral-200 dark:bg-zinc-800" />
          <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
            secure connection
          </span>
          <div className="h-px flex-1 bg-neutral-200 dark:bg-zinc-800" />
        </div>

        {/* Back Link */}
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 font-medium transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to home</span>
        </Link>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-zinc-950 flex flex-col items-center justify-center relative text-neutral-900 dark:text-neutral-50 transition-colors duration-300 overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1200px] h-[750px] bg-gradient-to-tr from-rose-500/30 via-orange-400/20 to-transparent rounded-full blur-[180px] pointer-events-none -z-10 animate-pulse-glow" />

      {/* Background Subtle Watermark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.01] dark:opacity-[0.03] pointer-events-none select-none -z-20">
        <svg
          viewBox="0 0 100 100"
          fill="currentColor"
          className="w-[500px] h-[500px]"
        >
          <path d="M20 25 L38 75 L50 45 L62 75 L80 25" />
        </svg>
      </div>

      <Suspense fallback={
        <div className="relative flex flex-col items-center max-w-[420px] w-full p-8 rounded-[24px] border border-neutral-200/80 dark:border-neutral-800/80 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl shadow-xl">
          <div className="animate-pulse flex flex-col items-center w-full">
            <div className="h-8 w-24 bg-neutral-200 dark:bg-zinc-800 rounded mb-8" />
            <div className="h-6 w-32 bg-neutral-200 dark:bg-zinc-800 rounded mb-2" />
            <div className="h-4 w-48 bg-neutral-200 dark:bg-zinc-800 rounded mb-8" />
            <div className="h-12 w-full bg-neutral-200 dark:bg-zinc-800 rounded-full" />
          </div>
        </div>
      }>
        <SignInContent />
      </Suspense>
    </div>
  );
}
