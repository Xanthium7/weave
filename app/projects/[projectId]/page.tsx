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
import { ToolActivity } from "@/components/tool-activity";
import { FileExplorer } from "@/components/file-explorer";

export default function ProjectPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const session = useSession();
  const projectId = params.projectId;

  const [project, setProject] = useState<any>(null);
  const [loadingProject, setLoadingProject] = useState(true);

  // Chat and file explorer mockup states (decoupled from sandbox and S3)
  const [messages, setMessages] = useState<any[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const previewUrl = "/mock-preview.html";

  const [files, setFiles] = useState<Map<string, string>>(() => {
    const map = new Map<string, string>();
    map.set(
      "src/App.tsx",
      `import React, { useState } from 'react';\n\nexport default function App() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div className="min-h-screen bg-[#0d070b] text-zinc-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">\n      {/* Glow background */}\n      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />\n\n      <div className="max-w-md w-full bg-[#181115]/80 border border-rose-950/20 backdrop-blur-xl rounded-2xl p-8 text-center shadow-2xl relative z-10">\n        <h1 className="text-3xl font-bold bg-gradient-to-tr from-rose-400 to-orange-400 bg-clip-text text-transparent mb-4 tracking-tight">\n          Interactive Sandbox\n        </h1>\n        <p className="text-zinc-400 text-sm mb-6 leading-relaxed font-sans">\n          This preview is loaded inside a high-fidelity workspace. Type adjustments in the chat bar on the left to simulate code updates!\n        </p>\n        <div className="p-4 bg-rose-950/15 border border-rose-950/10 rounded-xl mb-6 flex flex-col items-center">\n          <span className="text-[11px] font-bold text-rose-400/60 uppercase tracking-widest mb-2">Simulated Interactive State</span>\n          <button \n            onClick={() => setCount(prev => prev + 1)}\n            className="px-6 py-2 bg-rose-500 hover:bg-rose-600 active:scale-95 transition-all text-white text-xs font-semibold rounded-full shadow-lg shadow-rose-500/20 cursor-pointer"\n          >\n            Clicked {count} times\n          </button>\n        </div>\n        <div className="text-[10px] text-zinc-500 font-mono">src/App.tsx</div>\n      </div>\n    </div>\n  );\n}`
    );
    map.set(
      "src/index.css",
      `@import "tailwindcss";\n\nbody {\n  margin: 0;\n  background-color: #0d070b;\n  font-family: system-ui, sans-serif;\n}`
    );
    map.set(
      "package.json",
      `{\n  "name": "weave-mock-app",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^19.0.0",\n    "react-dom": "^19.0.0",\n    "lucide-react": "^0.400.0"\n  }\n}`
    );
    return map;
  });

  const [inputText, setInputText] = useState("");
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
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

  // Auto-select first file on mount/load
  useEffect(() => {
    if (!selectedFilePath && files.size > 0) {
      setSelectedFilePath(Array.from(files.keys())[0]);
    }
  }, [files, selectedFilePath]);

  // 3. Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isStreaming) return;

    const text = inputText.trim();
    setInputText("");

    // 1. Add user message
    const userMsg = {
      id: String(Date.now()),
      sender: "user" as const,
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);

    // 2. Simulate AI agent writing code and completing stream
    setTimeout(() => {
      // Simulate Bot starting writing task
      const aiMsg = {
        id: String(Date.now() + 1),
        sender: "ai" as const,
        text: "Updating application components to reflect your request. Modifying source files...",
        timestamp: new Date(),
        toolCalls: [
          {
            tool: "writeFile",
            args: { path: "src/App.tsx" }
          }
        ]
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Edit files in response to key phrases to make the demo feel highly interactive
      setFiles((prevMap) => {
        const nextMap = new Map(prevMap);
        const lowerText = text.toLowerCase();
        let newAppCode = prevMap.get("src/App.tsx") || "";

        if (lowerText.includes("color") || lowerText.includes("theme") || lowerText.includes("dark") || lowerText.includes("blue")) {
          newAppCode = newAppCode.replace("bg-[#0d070b]", "bg-[#090b14]")
                                 .replace("bg-rose-500/10", "bg-violet-500/10")
                                 .replace("border-rose-950/20", "border-violet-950/20")
                                 .replace("bg-rose-950/15", "bg-violet-950/15")
                                 .replace("bg-rose-500", "bg-violet-500")
                                 .replace("shadow-rose-500/20", "shadow-violet-500/20")
                                 .replace("text-rose-400", "text-violet-400")
                                 .replace("from-rose-400 to-orange-400", "from-violet-400 to-cyan-400");
        } else if (lowerText.includes("button") || lowerText.includes("text") || lowerText.includes("heading")) {
          newAppCode = newAppCode.replace("Interactive Sandbox", "Customized Application")
                                 .replace("Type adjustments in the chat bar", "Your application interface has been rebuilt!");
        }

        nextMap.set("src/App.tsx", newAppCode);
        return nextMap;
      });

      // Complete stream
      setTimeout(() => {
        setIsStreaming(false);
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (lastIdx >= 0 && updated[lastIdx].sender === "ai") {
            updated[lastIdx] = {
              ...updated[lastIdx],
              text: `I've successfully updated your code inside the workspace. The modifications have been written to \`src/App.tsx\`.\n\nYou can review the updated source in the "Code" tab or try clicking the button in the "Preview" panel!`,
              timestamp: new Date(),
            };
          }
          return updated;
        });
      }, 1000);
    }, 800);
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
                toolCalls={msg.toolCalls}
              />
            ),
          )}

          {/* AI Generation Loading Indicator Bubble */}
          {isStreaming && (
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
              disabled={isStreaming}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask Weave to make adjustments..."
              className="w-full pl-5 pr-14 py-3.5 bg-[#1f161c]/90 border border-rose-950/40 rounded-full text-sm outline-none focus:border-rose-500/60 focus:ring-1 focus:ring-rose-500/20 transition-all font-sans text-zinc-100 placeholder-zinc-500 disabled:opacity-75 shadow-inner"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isStreaming}
              className={`absolute right-2 flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 cursor-pointer ${
                inputText.trim() && !isStreaming
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
                href={previewUrl ?? "#"}
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
              src={previewUrl ?? "about:blank"}
              className="w-full h-full border-0 bg-zinc-950"
              title="Live Website Preview"
              allow="autoplay"
            />
          </div>

          {/* CODE EXPLORER VIEW */}
          <div
            className={`w-full h-full rounded-2xl border border-rose-950/20 bg-[#070507] text-neutral-400 font-mono text-xs overflow-hidden flex flex-col shadow-2xl transition-opacity duration-300 ${
              activeTab === "code"
                ? "opacity-100 relative z-10"
                : "opacity-0 absolute pointer-events-none -z-10"
            }`}
          >
            <FileExplorer
              files={files}
              selectedPath={selectedFilePath}
              onSelect={setSelectedFilePath}
              isLoading={isLoadingFiles}
            />
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
  const displayTime = (
    typeof timestamp === "string" ? new Date(timestamp) : timestamp
  ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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

export function AiMessage({
  text,
  timestamp,
  toolCalls,
}: MessageProps & { toolCalls?: any[] }) {
  const displayTime = (
    typeof timestamp === "string" ? new Date(timestamp) : timestamp
  ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex gap-3 max-w-[85%] mr-auto">
      <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-semibold shadow-sm border bg-rose-950/30 border-rose-900/30 text-rose-400">
        <Bot className="w-4 h-4" />
      </div>

      <div className="space-y-1.5 flex-1 max-w-[calc(100%-2.5rem)]">
        {text && (
          <div className="px-4.5 py-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap bg-[#1f161c]/80 text-zinc-200 border border-rose-950/30 rounded-tl-none">
            {text}
          </div>
        )}

        {toolCalls && toolCalls.length > 0 && (
          <div className="flex flex-col gap-2 mt-1">
            {toolCalls.map((tc, idx) => (
              <ToolActivity key={idx} tool={tc.tool} args={tc.args} />
            ))}
          </div>
        )}

        <div className="text-[10px] text-zinc-500 font-medium text-left px-1">
          {displayTime}
        </div>
      </div>
    </div>
  );
}
