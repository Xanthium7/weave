"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { getProject } from "@/actions/dbActions";
import {
  Send,
  Terminal,
  Code,
  Laptop,
  Loader2,
  Play,
  ArrowLeft,
  Bot,
  User as UserIcon,
  ChevronRight,
  Maximize2,
} from "lucide-react";
import { getAiResponse } from "@/actions/loop";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
}

export default function ProjectPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const session = useSession();
  const projectId = params.projectId;

  const [project, setProject] = useState<any>(null);
  const [loadingProject, setLoadingProject] = useState(true);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");

  // Resize Splitter State
  const [leftWidth, setLeftWidth] = useState(420);
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = (mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const minWidth = 320;
      const maxWidth = window.innerWidth * 0.7; // max 70% of screen width
      const newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX));
      setLeftWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // 1. Authenticate check
  useEffect(() => {
    if (session.status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [session.status, router]);

  // 2. Fetch project details
  useEffect(() => {
    if (!projectId) return;

    const fetchProject = async () => {
      setLoadingProject(true);
      try {
        const data = await getProject(projectId);
        if (data) {
          setProject(data);
          // Initialize chat history with the user's initial prompt and AI's welcome reply
          setMessages([
            {
              id: "1",
              sender: "user",
              text: data.initialPrompt,
              timestamp: new Date(data.createdAt),
            },
            {
              id: "2",
              sender: "ai",
              text: `Hi! I've set up your project "${data.name}" based on your prompt. \n\nI initialized the workspace and loaded a live interactive preview for you on the right side. You can explore the rendered preview or toggle the "Code" tab to view the source code. \n\nHow would you like to build or modify it next?`,
              timestamp: new Date(data.createdAt),
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to load project details", err);
      } finally {
        setLoadingProject(false);
      }
    };

    fetchProject();
  }, [projectId]);
  const handleAiResponse = async () => {
      await getAiResponse(inputText)
    }

  // 3. Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sendingMessage]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sendingMessage) return;

    const userText = inputText.trim();
    setInputText("");

    // Add user message
    const userMsg: Message = {
      id: Math.random().toString(36).substring(7),
      sender: "user",
      text: userText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setSendingMessage(true);

    


    // Simulate AI response/generation pipeline
    setTimeout(() => {
      const aiMsg: Message = {
        id: Math.random().toString(36).substring(7),
        sender: "ai",
        text: `I've analyzed your request: "${userText}". I am currently updating the stylesheet and script hooks to apply those changes. The live preview on the right will update in a moment.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setSendingMessage(false);
    }, 1800);
  };



  if (session.status === "loading" || loadingProject) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
        <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
          Loading workspace...
        </p>
      </div>
    );
  }

  if (!session.data) {
    return null; // Handled by auth useEffect redirect
  }

  return (
    <div className="min-h-screen h-screen flex bg-[#0f090c] text-zinc-100 overflow-hidden relative">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[1200px] h-[750px] bg-gradient-to-tr from-rose-500/20 via-orange-400/10 to-transparent rounded-full blur-[160px] pointer-events-none -z-10 animate-pulse-glow" />

      {/* LEFT COLUMN: CHAT WINDOW */}
      <aside
        style={{ width: `${leftWidth}px` }}
        className="shrink-0 flex flex-col h-full bg-[#181115]/80 border-r border-rose-950/20 backdrop-blur-xl"
      >
        {/* Project Details Panel Header */}
        <div className="px-6 py-4.5 border-b border-rose-950/20 flex items-center justify-between bg-[#1f161c]/40">
          <div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-rose-400/50 uppercase tracking-widest">
              <span>Active Project</span>
              <ChevronRight className="w-3 h-3" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-100 tracking-tight leading-tight mt-0.5">
              {project?.name || "GoofyProject"}
            </h2>
          </div>

          <Link
            href="/"
            className="p-2 rounded-full border border-rose-950/40 hover:bg-rose-950/30 text-rose-400/70 hover:text-rose-300 transition-all cursor-pointer bg-[#181115]/50"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

        {/* Messages Thread Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {messages.map((msg) =>
            msg.sender === "user" ? (
              <UserMessage
                key={msg.id}
                text={msg.text}
                timestamp={msg.timestamp}
              />
            ) : (
              <AiMessage
                key={msg.id}
                text={msg.text}
                timestamp={msg.timestamp}
              />
            )
          )}

          {/* AI Generation Loading Indicator Bubble */}
          {sendingMessage && (
            <div className="flex gap-3 max-w-[85%] mr-auto">
              <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-rose-950/30 border border-rose-900/30 text-rose-400 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-[#1f161c]/80 border border-rose-950/30 px-4.5 py-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                <span className="text-sm text-zinc-400 font-medium">
                  Weaving updates...
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Chat Input Form Container */}
        <div className="p-4 border-t border-rose-950/20 bg-[#160f13]/60 backdrop-blur-md">
          <form
            onSubmit={handleSendMessage}
            className="relative flex items-center"
          >
            <input
              type="text"
              disabled={sendingMessage}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask Weave to make adjustments..."
              className="w-full pl-5 pr-14 py-3.5 bg-[#1f161c]/90 border border-rose-950/40 rounded-full text-sm outline-none focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/20 transition-all font-sans text-zinc-100 placeholder-zinc-500 disabled:opacity-75 shadow-inner"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sendingMessage}
              onClick={handleAiResponse}
              className={`absolute right-2 flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 cursor-pointer ${
                inputText.trim() && !sendingMessage
                  ? "bg-rose-500 hover:bg-rose-600 text-white hover:scale-105 shadow-md shadow-rose-500/20"
                  : "bg-zinc-800 text-zinc-650 cursor-not-allowed"
              }`}
            >
              <Send className="w-3.5 h-3.5 stroke-[2.2]" />
            </button>
          </form>
        </div>
      </aside>

      {/* DRAG HANDLE BAR */}
      <div
        onMouseDown={startResizing}
        className={`w-[5px] hover:w-1.5 active:w-1.5 bg-transparent hover:bg-rose-500/80 active:bg-rose-600 cursor-col-resize h-full transition-all duration-150 z-30 shrink-0 relative flex items-center justify-center border-r border-l border-rose-100/20 dark:border-rose-950/20 ${
          isResizing ? "bg-rose-500 w-1.5 border-none" : ""
        }`}
      >
        {/* Subtle drag bar line */}
        <div className="w-[1px] h-8 bg-rose-900/40 rounded-full" />
      </div>

      {/* RIGHT COLUMN: PREVIEW / CODE VIEWER PANEL */}
      <main className="flex-1 flex flex-col bg-transparent h-full overflow-hidden relative">
        {/* Overlay to prevent iframe mouse capturing during resize dragging */}
        {isResizing && (
          <div className="absolute inset-0 z-[9999] bg-transparent cursor-col-resize" />
        )}

        {/* Tabs Control Header */}
        <div className="h-15.5 px-6 border-b border-rose-950/20 flex items-center justify-between bg-[#150f13]/40 backdrop-blur-sm">
          {/* Left aligned tab selection pills */}
          <div className="flex gap-1.5 p-1 bg-[#1e151b]/80 border border-rose-950/20 rounded-full">
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1.5 px-4.5 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                activeTab === "preview"
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
              <span className="font-medium">Preview</span>
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`flex items-center gap-1.5 px-4.5 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                activeTab === "code"
                  ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span className="font-medium">Code</span>
            </button>
          </div>

          {/* Right actions (Expand / Refresh / Copy Code) */}
          <div className="flex items-center gap-3">
            {activeTab === "preview" && (
              <a
                href="https://patatap.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-rose-500/30 bg-rose-950/20 hover:bg-rose-900/30 text-rose-300 rounded-lg transition cursor-pointer hover:border-rose-500/50"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Open in tab</span>
              </a>
            )}
          </div>
        </div>

        {/* Core Panel Content */}
        <div className="flex-1 p-6 overflow-hidden relative">
          {/* LIVE PREVIEW IFRAME VIEW */}
          <div
            className={`w-full h-full rounded-2xl border border-rose-950/20 overflow-hidden shadow-2xl bg-zinc-950/40 backdrop-blur-sm transition-opacity duration-300 ${
              activeTab === "preview"
                ? "opacity-100 relative z-10"
                : "opacity-0 absolute pointer-events-none -z-10"
            }`}
          >
            <iframe
              src="https://patatap.com"
              className="w-full h-full border-0 bg-zinc-950"
              title="Live Website Preview"
              allow="autoplay"
            />
          </div>

          {/* STATIC CODE VIEWER */}
          <div
            className={`w-full h-full rounded-2xl border border-rose-950/20 bg-[#070507] text-neutral-400 font-mono text-xs overflow-hidden flex flex-col shadow-2xl transition-opacity duration-300 ${
              activeTab === "code"
                ? "opacity-100 relative z-10"
                : "opacity-0 absolute pointer-events-none -z-10"
              }`}
          >
            {/* Clean solid black placeholder code view */}
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#070507]">
              <div className="w-12 h-12 rounded-full bg-zinc-950/80 flex items-center justify-center mb-4 text-rose-500 border border-rose-950/30 shadow-inner">
                <Code className="w-5 h-5 animate-pulse text-rose-400" />
              </div>
              <h3 className="text-zinc-200 font-sans font-semibold text-base mb-1 tracking-tight">
                Source Code Workspace
              </h3>
              <p className="text-zinc-500 font-sans text-xs max-w-sm leading-relaxed">
                Weave builds and updates application files dynamically. When code generation is connected, files will render directly here.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

interface MessageProps {
  text: string;
  timestamp: Date | string;
}

export function UserMessage({ text, timestamp }: MessageProps) {
  const displayTime = (typeof timestamp === "string" ? new Date(timestamp) : timestamp)
    .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex gap-3 max-w-[85%] ml-auto flex-row-reverse">
      <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold shadow-sm border bg-rose-500 border-rose-400 text-white shadow-sm shadow-rose-500/10">
        <UserIcon className="w-3.5 h-3.5" />
      </div>

      <div className="space-y-1">
        <div className="px-4.5 py-2 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-tr-none shadow-md shadow-rose-500/10">
          {text}
        </div>
        <div className="text-[10px] text-zinc-500 font-medium text-right">
          {displayTime}
        </div>
      </div>
    </div>
  );
}

export function AiMessage({ text, timestamp }: MessageProps) {
  const displayTime = (typeof timestamp === "string" ? new Date(timestamp) : timestamp)
    .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex gap-3 max-w-[85%] mr-auto">
      <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold shadow-sm border bg-rose-950/30 border-rose-900/30 text-rose-400">
        <Bot className="w-4 h-4" />
      </div>

      <div className="space-y-1">
        <div className="px-4.5 py-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap bg-[#1f161c]/80 text-zinc-200 border border-rose-950/30 rounded-tl-none">
          {text}
        </div>
        <div className="text-[10px] text-zinc-500 font-medium text-left">
          {displayTime}
        </div>
      </div>
    </div>
  );
}
