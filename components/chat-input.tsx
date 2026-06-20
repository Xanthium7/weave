"use client";

import React, { useState } from "react";
import { Paperclip, Globe, ArrowUp, ShoppingBag, BookOpen, Laptop, FolderGit } from "lucide-react";

export function ChatInput() {
  const [inputValue, setInputValue] = useState("");

  const handleSuggestionClick = (text: string) => {
    setInputValue(`Create a ${text.toLowerCase()} with...`);
  };

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 z-10">
      {/* Glow effect behind the input container */}
      <div className="relative group">
        <div className="absolute -inset-16 bg-linear-to-r from-rose-500/35 via-orange-500/20 to-rose-500/35 rounded-[36px] blur-2xl opacity-80 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
        
        {/* Glassmorphic input container */}
        <div className="relative flex flex-col w-full min-h-[160px] rounded-[24px] border border-neutral-200/80 dark:border-neutral-800/80 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl shadow-xl transition-all duration-300 focus-within:border-rose-500/50 focus-within:shadow-[0_0_30px_rgba(244,63,94,0.15)] overflow-hidden">
          {/* Input text field */}
          <textarea
            placeholder="Ask Weave build..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full flex-1 p-6 pb-2 text-[17px] text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 bg-transparent border-0 outline-none resize-none focus:ring-0 font-sans min-h-[90px]"
          />

          {/* Action buttons footer */}
          <div className="flex items-center justify-between px-5 pb-5 pt-2">
            {/* Left buttons (Attach, Online) */}
            <div className="flex gap-2.5">
              <button className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-full border border-neutral-200/60 dark:border-neutral-800/80 bg-white/70 dark:bg-zinc-900/60 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-zinc-800/80 transition-all duration-200 shadow-sm cursor-pointer">
                <Paperclip className="w-3.5 h-3.5" />
                <span>Attach</span>
              </button>
              <button className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-full border border-neutral-200/60 dark:border-neutral-800/80 bg-white/70 dark:bg-zinc-900/60 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-zinc-800/80 transition-all duration-200 shadow-sm cursor-pointer">
                <Globe className="w-3.5 h-3.5" />
                <span>Online</span>
              </button>
            </div>

            {/* Right button (Send) */}
            <button 
              disabled={!inputValue.trim()}
              className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 cursor-pointer ${
                inputValue.trim()
                  ? "bg-black dark:bg-white text-white dark:text-black hover:scale-105 shadow-md"
                  : "bg-neutral-100 dark:bg-zinc-900 text-neutral-300 dark:text-zinc-700 cursor-not-allowed"
              }`}
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>

      {/* Suggestion pills container */}
      <div className="flex flex-wrap justify-center items-center gap-2 mt-5 select-none animate-float">
        <button 
          onClick={() => handleSuggestionClick("E-commerce website")}
          className="flex items-center gap-1.5 px-4 py-2 text-xs md:text-[13px] font-medium rounded-full border border-neutral-200/80 dark:border-neutral-800 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-white dark:hover:bg-zinc-900 transition-all duration-200 shadow-sm cursor-pointer"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-neutral-500" />
          <span>E-commerce website</span>
        </button>

        <button 
          onClick={() => handleSuggestionClick("Personal blog")}
          className="flex items-center gap-1.5 px-4 py-2 text-xs md:text-[13px] font-medium rounded-full border border-neutral-200/80 dark:border-neutral-800 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-white dark:hover:bg-zinc-900 transition-all duration-200 shadow-sm cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5 text-neutral-500" />
          <span>Personal blog</span>
        </button>

        <button 
          onClick={() => handleSuggestionClick("Landing page")}
          className="flex items-center gap-1.5 px-4 py-2 text-xs md:text-[13px] font-medium rounded-full border border-neutral-200/80 dark:border-neutral-800 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-white dark:hover:bg-zinc-900 transition-all duration-200 shadow-sm cursor-pointer"
        >
          <Laptop className="w-3.5 h-3.5 text-neutral-500" />
          <span>Landing page</span>
        </button>

        <button 
          onClick={() => handleSuggestionClick("Portfolio site")}
          className="flex items-center gap-1.5 px-4 py-2 text-xs md:text-[13px] font-medium rounded-full border border-neutral-200/80 dark:border-neutral-800 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-white dark:hover:bg-zinc-900 transition-all duration-200 shadow-sm cursor-pointer"
        >
          <FolderGit className="w-3.5 h-3.5 text-neutral-500" />
          <span>Portfolio site</span>
        </button>
      </div>
    </div>
  );
}
