"use client";

import {
  FileCode,
  Code,
  Loader2,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
} from "lucide-react";
import {
  Tree,
  Folder,
  File,
  type TreeViewElement,
} from "@/components/ui/file-tree";

interface FileExplorerProps {
  files: Map<string, string>;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  isLoading?: boolean;
}

function buildFileTree(files: Map<string, string>): TreeViewElement[] {
  const root: TreeViewElement[] = [];

  for (const path of files.keys()) {
    const parts = path.split("/").filter(Boolean);
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join("/");

      let existing = currentLevel.find((el) => el.name === part);

      if (!existing) {
        existing = {
          id: currentPath,
          name: part,
          type: isFile ? "file" : "folder",
          children: isFile ? undefined : [],
        };
        currentLevel.push(existing);
      }

      if (!isFile && existing.children) {
        currentLevel = existing.children;
      }
    }
  }

  // Sort folders first, then files alphabetically
  const sortTree = (nodes: TreeViewElement[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === "folder" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) {
      if (node.children) {
        sortTree(node.children);
      }
    }
  };
  sortTree(root);

  return root;
}

export function FileExplorer({
  files,
  selectedPath,
  onSelect,
  isLoading,
}: FileExplorerProps) {
  const sortedPaths = Array.from(files.keys()).sort();

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#070507] h-full">
        <Loader2 className="w-6 h-6 animate-spin text-rose-500 mb-3" />
        <p className="text-sm text-zinc-500">Loading files...</p>
      </div>
    );
  }

  if (sortedPaths.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#070507] h-full">
        <div className="w-12 h-12 rounded-full bg-zinc-950/80 flex items-center justify-center mb-4 text-rose-500 border border-rose-950/30">
          <Code className="w-5 h-5 animate-pulse text-rose-400" />
        </div>
        <h3 className="text-zinc-200 font-sans font-semibold text-base mb-1">
          Source Code Workspace
        </h3>
        <p className="text-zinc-500 font-sans text-xs max-w-sm leading-relaxed">
          Files will appear here as the AI writes code.
        </p>
      </div>
    );
  }

  const treeElements = buildFileTree(files);

  // We want to auto-expand all folders by default.
  const getAllFolderIds = (nodes: TreeViewElement[]): string[] => {
    const ids: string[] = [];
    const traverse = (nList: TreeViewElement[]) => {
      for (const n of nList) {
        if (n.type === "folder") {
          ids.push(n.id);
          if (n.children) traverse(n.children);
        }
      }
    };
    traverse(nodes);
    return ids;
  };
  const folderIds = getAllFolderIds(treeElements);

  const renderTree = (elements: TreeViewElement[]) => {
    return elements.map((element) => {
      if (element.type === "folder") {
        return (
          <Folder
            key={element.id}
            value={element.id}
            element={element.name}
            className="w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs font-mono text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200 transition-colors cursor-pointer rounded-none bg-transparent hover:no-underline select-none"
          >
            {element.children ? renderTree(element.children) : null}
          </Folder>
        );
      }

      const isSelected = selectedPath === element.id;
      return (
        <File
          key={element.id}
          value={element.id}
          isSelect={isSelected}
          className={`w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer rounded-none ${
            isSelected
              ? "bg-rose-500/15 text-rose-300 border-r-2 border-rose-500"
              : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
          }`}
          fileIcon={
            <FileCode className="w-3.5 h-3.5 shrink-0 text-rose-400/50" />
          }
          handleSelect={() => onSelect(element.id)}
        >
          <span className="truncate">{element.name}</span>
        </File>
      );
    });
  };

  return (
    <div className="flex h-full bg-[#070507]">
      <div className="w-60 border-r border-rose-950/20 bg-[#0a070a] py-2 flex flex-col">
        <div className="px-3 py-2 text-[10px] font-bold text-rose-400/40 uppercase tracking-widest shrink-0">
          Files
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          <Tree
            className="p-1 bg-transparent overflow-hidden"
            initialSelectedId={selectedPath || undefined}
            initialExpandedItems={folderIds}
            openIcon={
              <FolderOpenIcon className="w-3.5 h-3.5 text-rose-400/50 shrink-0" />
            }
            closeIcon={
              <FolderIcon className="w-3.5 h-3.5 text-rose-400/50 shrink-0" />
            }
          >
            {renderTree(treeElements)}
          </Tree>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {selectedPath ? (
          <div className="relative">
            <div className="sticky top-0 z-10 px-4 py-2 bg-[#0d0a0d]/95 border-b border-rose-950/20 backdrop-blur-sm">
              <span className="text-[11px] font-mono text-zinc-500">
                {selectedPath}
              </span>
            </div>
            <div className="p-4 flex">
              <div className="pr-4 text-right select-none border-r border-zinc-800/50 mr-4">
                {(files.get(selectedPath) || "").split("\n").map((_, i) => (
                  <div
                    key={i}
                    className="text-[11px] font-mono text-zinc-700 leading-5"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
              <pre className="flex-1 text-[12px] font-mono text-zinc-300 whitespace-pre leading-5 overflow-x-auto">
                {files.get(selectedPath) || ""}
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
            Select a file to view its contents
          </div>
        )}
      </div>
    </div>
  );
}
