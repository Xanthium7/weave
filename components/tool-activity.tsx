"use client";

"use client";

import {
  Loader2,
  FileCode,
  Terminal,
  FolderOpen,
  Trash2,
  Edit,
} from "lucide-react";

const TOOL_CONFIG: Record<string, { label: (a: any) => string; icon: any }> = {
  writeFile: {
    label: (a) => `Writing ${a?.path?.split("/").pop() || "file"}`,
    icon: FileCode,
  },
  readFile: {
    label: (a) => `Reading ${a?.path?.split("/").pop() || "file"}`,
    icon: FileCode,
  },
  updateFile: {
    label: (a) => `Updating ${a?.path?.split("/").pop() || "file"}`,
    icon: Edit,
  },
  listFiles: {
    label: (a) => `Listing ${a?.path || "directory"}`,
    icon: FolderOpen,
  },
  deleteFile: {
    label: (a) => `Deleting ${a?.path?.split("/").pop() || "file"}`,
    icon: Trash2,
  },
  runCommand: { label: (a) => `$ ${a?.command || "command"}`, icon: Terminal },
};

export function ToolActivity({
  tool,
  args,
}: {
  tool: string;
  args?: Record<string, unknown>;
}) {
  const config = TOOL_CONFIG[tool];
  const Icon = config?.icon || Terminal;
  const label = config?.label(args || {}) || tool;

  return (
    <div className="flex items-center gap-2.5 bg-[#1f161c]/80 border border-rose-950/30 px-4 py-2.5 rounded-2xl rounded-tl-none">
      <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
      <Icon className="w-3.5 h-3.5 text-rose-400/60" />
      <span className="text-xs text-zinc-300 font-mono truncate max-w-[250px]">
        {label}
      </span>
    </div>
  );
}
