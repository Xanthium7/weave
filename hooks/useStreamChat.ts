"use client";
import { getAiResponse } from "@/actions/loop";
import { getProjectFiles } from "@/actions/sandbox";
import { StreamEvent } from "@/types/stream";
import { readStreamableValue } from "@ai-sdk/rsc";
import { useState } from "react";

export type ChatMessage = {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
  toolCalls?: TooCallInfo[];
  isStreaming?: boolean;
};

export type TooCallInfo = {
  tool: string;
  args: Record<string, unknown>;
  result?: Record<string, unknown>;
  status: "running" | "done" | "error";
};

export function useStreamChat(projectId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [files, setFiles] = useState(new Map<string, string>());
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [activeToolCall, setActiveToolCall] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const loadFilesFromS3 = async () => {
    setLoadingFiles(true);
    try {
      const fileMap = await getProjectFiles(projectId);
      if (Object.keys(fileMap).length > 0) {
        // we got backups
        setFiles(new Map(Object.entries(fileMap)));
      }
    } catch (err) {
      console.error("[loading file] shi broke: ", err);
    } finally {
      setLoadingFiles(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (isStreaming) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      text,
      timestamp: new Date(),
    };
    const aiMsgId = crypto.randomUUID();
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      sender: "ai",
      text: "",
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setIsStreaming(true);

    try {
      const streamValue = await getAiResponse(projectId, text);
      for await (const event of readStreamableValue(streamValue)) {
        if (!event) continue;
        handleStreamEvent(event, aiMsgId);
      }
    } catch (error: any) {
      console.error("[sendinMessage] error:", error);
      updateAiMessage(aiMsgId, (msg) => ({
        ...msg,
        text: msg.text || "Shi just broke twin 🥀",
        isStreaming: false,
      }));
    } finally {
      setIsStreaming(false);
      updateAiMessage(aiMsgId, (msg) => ({
        ...msg,
        isStreaming: false,
      }));
    }
  };

  const handleStreamEvent = (event: StreamEvent, aiMsgId: string) => {
    switch (event.type) {
      case "text-delta":
        updateAiMessage(aiMsgId, (msg) => ({
          ...msg,
          text: msg.text + event.content,
        }));
        break;

      case "tool-call":
        setActiveToolCall(event.tool);
        updateAiMessage(aiMsgId, (msg) => ({
          ...msg,
          toolCalls: [
            ...(msg.toolCalls || []),
            { tool: event.tool, args: event.args, status: "running" as const },
          ],
        }));
        break;

      case "tool-result":
        setActiveToolCall(null);
        updateAiMessage(aiMsgId, (msg) => ({
          ...msg,
          toolCalls: (msg.toolCalls || []).map((tc) =>
            tc.tool === event.tool && tc.status === "running"
              ? { ...tc, result: event.result, status: "done" as const }
              : tc,
          ),
        }));
        break;

      case "file-write":
        setFiles((prev) => new Map(prev).set(event.path, event.content)); // update the file content in the path
        break;

      case "file-delete":
        setFiles((prev) => {
          const next = new Map(prev);
          next.delete(event.path);
          return next;
        });
        break;

      case "preview-url":
        setPreviewUrl(event.url);
        break;

      case "error":
        updateAiMessage(aiMsgId, (msg) => ({
          ...msg,
          text:
            msg.text +
            `\nSomthing Broke the the switch case twin 🥀: ${event.content}`,
        }));
        break;

      case "text-complete":
      case "done":
        break;
    }
  };

  const updateAiMessage = (
    id: string,
    updater: (msg: ChatMessage) => ChatMessage,
  ) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? updater(m) : m)));
  };

  return {
    messages,
    setMessages,
    isStreaming,
    loadingFiles,
    sendMessage,
    loadFilesFromS3,
    previewUrl,
    files,
    activeToolCall,
  };
}
