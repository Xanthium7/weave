import { StreamEvent } from "@/types/stream";
import { createStreamableValue } from "@ai-sdk/rsc";
import type Sandbox from "@e2b/code-interpreter";
import { Type } from "@google/genai";

const PROJECT_DIR = "/home/user/LovableProject";

export function resolveSandboxPath(path: string): string {
  // Normalize double slashes
  path = path.replace(/\/+/g, "/");

  // Handle home directory representation
  if (path === "/home/user" || path === "/home/user/") {
    return PROJECT_DIR;
  }

  // If it's already under the project dir, or it is in /tmp, leave it
  if (path.startsWith(PROJECT_DIR)) {
    return path;
  }
  if (path.startsWith("/tmp")) {
    return path;
  }

  // If it is absolute under /home/user, redirect to PROJECT_DIR
  if (path.startsWith("/home/user/")) {
    return path.replace(/^\/home\/user\//, `${PROJECT_DIR}/`);
  }

  // If it's absolute but not under home/user or /tmp (e.g. /app/package.json)
  if (path.startsWith("/")) {
    return `${PROJECT_DIR}${path}`;
  }

  // If it's relative, make it relative to PROJECT_DIR
  return `${PROJECT_DIR}/${path}`;
}

export const readFile = async (sandbox: Sandbox, path: string) => {
  try {
    const resolvedPath = resolveSandboxPath(path);
    return await sandbox.files.read(resolvedPath);
  } catch (err: any) {
    throw new Error(`Failed to read file at ${path}: ${err.message}`);
  }
};

export const writeFile = async (
  sandbox: Sandbox,
  path: string,
  fileContents: string,
) => {
  try {
    const resolvedPath = resolveSandboxPath(path);
    await sandbox.files.write(resolvedPath, fileContents);
  } catch (err: any) {
    throw new Error(`Failed to write file at ${path}: ${err.message}`);
  }
};

export const updateFile = async (
  sandbox: Sandbox,
  path: string,
  startLine: number,
  endLine: number,
  replacementContent: string,
): Promise<void> => {
  try {
    const resolvedPath = resolveSandboxPath(path);
    const originalContent = await sandbox.files.read(resolvedPath);
    const isCrlf = originalContent.includes("\r\n");
    const lineEnding = isCrlf ? "\r\n" : "\n";
    const lines = originalContent.split(lineEnding);
    const startIndex = startLine - 1;
    const deleteCount = endLine - startLine + 1;
    const replacementLines = replacementContent.split(/\r?\n/);
    lines.splice(startIndex, deleteCount, ...replacementLines);
    const updatedContent = lines.join(lineEnding);
    await sandbox.files.write(resolvedPath, updatedContent);
  } catch (error: any) {
    throw new Error(
      `Failed to update lines ${startLine}-${endLine} in file ${path}: ${error.message}`,
    );
  }
};

export const listFiles = async (
  sandbox: Sandbox,
  path: string,
): Promise<Array<{ name: string; path: string; isDir: boolean }>> => {
  try {
    const resolvedPath = resolveSandboxPath(path);
    const files = await sandbox.files.list(resolvedPath);
    return files.map((file) => ({
      name: file.name,
      // Replaces double slashes if any (e.g. //src -> /src)
      path: `${path}/${file.name}`.replace(/\/+/g, "/"),
      isDir: file.type === "dir",
    }));
  } catch (err: any) {
    throw new Error(`Failed to list files in ${path}: ${err.message}`);
  }
};

export const deletFile = async (sandbox: Sandbox, path: string) => {
  try {
    const resolvedPath = resolveSandboxPath(path);
    await sandbox.files.remove(resolvedPath);
  } catch (err: any) {
    throw new Error(`Failed to delete file in ${path}: ${err.message}`);
  }
};

export const runCommand = async (
  sandbox: Sandbox,
  command: string,
  options?: { cwd?: string; background?: boolean },
) => {
  try {
    const cwd = options?.cwd ? resolveSandboxPath(options.cwd) : PROJECT_DIR;
    const process = await sandbox.commands.run(command, {
      ...options,
      cwd,
    });
    return {
      stdout: process.stdout,
      stderr: process.stderr,
      exitCode: process.exitCode ?? 0,
    };
  } catch (error: any) {
    throw new Error(`Failed to run command ${command}: ${error.message}`);
  }
};

// llm tools schema
const listFilesTool = {
  name: "listFiles",
  description:
    "Lists all files and subdirectories in a directory path inside the sandbox.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: {
        type: Type.STRING,
        description: "The absolute  directory path to list.",
      },
    },
    required: ["path"],
  },
};

const readFileTool = {
  name: "readFile",
  description: "Reads and returns the contents of a file inside the sandbox.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: {
        type: Type.STRING,
        description: "The absolute path of the file to read.",
      },
    },
    required: ["path"],
  },
};

const deletFileTool = {
  name: "deleteFile",
  description: "Deletes a file from the sandbox.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: {
        type: Type.STRING,
        description: "The absolute path of the file to delete.",
      },
    },
    required: ["path"],
  },
};

const updateFileTool = {
  name: "updateFile",
  description:
    "Replaces a contiguous block of lines in a file with new content.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: {
        type: Type.STRING,
        description: "The absolute path of the file to update.",
      },
      startLine: {
        type: Type.INTEGER,
        description:
          "The line number where the replacement should start (1-indexed).",
      },
      endLine: {
        type: Type.INTEGER,
        description:
          "The line number where the replacement should end (inclusive).",
      },
      replacementContent: {
        type: Type.STRING,
        description: "The new content to write in place of the target lines.",
      },
    },
    required: ["path", "startLine", "endLine", "replacementContent"],
  },
};

const writeFileTool = {
  name: "writeFile",
  description:
    "Creates or overwrites a file with the given content in the sandbox.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: {
        type: Type.STRING,
        description: "The destination file path inside the sandbox.",
      },
      fileContents: {
        type: Type.STRING,
        description: "The text content to write into the file.",
      },
    },
    required: ["path", "fileContents"],
  },
};

const runCommandTool = {
  name: "runCommand",
  description: "Runs a shell command inside the sandbox container.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      command: {
        type: Type.STRING,
        description:
          "The shell command to run, e.g., 'npm install', 'git clone', or 'npm run dev -- --host 0.0.0.0'.",
      },
      cwd: {
        type: Type.STRING,
        description:
          "The directory inside the sandbox where the command should execute.",
      },
      background: {
        type: Type.BOOLEAN,
        description:
          "Whether to run the command in the background (use true for starting dev servers).",
      },
    },
    required: ["command"],
  },
};

export async function executeTool(
  sandbox: Sandbox,
  toolName: string,
  args: Record<string, unknown>,
  stream?: ReturnType<typeof createStreamableValue<StreamEvent>>,
) {
  try {
    switch (toolName) {
      case "writeFile": {
        const path = args.path as string;
        const content = args.fileContents as string;
        await writeFile(sandbox, path, content);
        // stream.update({ type: "file-write", path, content });
        return { success: true, path };
      }

      case "readFile": {
        const path = args.path as string;
        const content = await readFile(sandbox, path);
        return { content };
      }

      case "updateFile": {
        const path = args.path as string;
        await updateFile(
          sandbox,
          path,
          args.startLine as number,
          args.endLine as number,
          args.replacementContent as string,
        );
        const updatedContent = await readFile(sandbox, path);
        // stream.update({ type: "file-write", path, content: updatedContent });
        return { success: true, path };
      }

      case "listFiles": {
        const path = args.path as string;
        const files = await listFiles(sandbox, path);
        return { files };
      }

      case "deleteFile": {
        const path = args.path as string;
        await deletFile(sandbox, path);
        // stream.update({ type: "file-delete", path });
        return { success: true, path };
      }

      case "runCommand": {
        const command = args.command as string;
        // stream.update({ type: "command-run", command });

        const result = await runCommand(sandbox, command, {
          cwd: args.cwd as string | undefined,
          background: args.background as boolean | undefined,
        });

        // stream.update({
        //   type: "command-output",
        //   stdout: result.stdout,
        //   stderr: result.stderr,
        //   exitCode: result.exitCode,
        // });

        if (
          args.background &&
          (command.includes("dev") || command.includes("start"))
        ) {
          await new Promise((r) => setTimeout(r, 3000));
          try {
            const host = sandbox.getHost(3000);
            // stream.update({ type: "preview-url", url: `https://${host}` });
            console.log("preview urll", `https://${host}`)
          } catch {}
        }

        return {
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
        };
      }

      default:
        return { error: `Unknown tool: ${toolName}` };
    }
  } catch (err: any) {
    console.error(`[Tool:${toolName}] Error:`, err.message);
    return { error: err.message };
  }
}

export const toolsConfig = [
  {
    functionDeclarations: [
      listFilesTool,
      writeFileTool,
      readFileTool,
      deletFileTool,
      updateFileTool,
      runCommandTool,
    ],
  },
];
