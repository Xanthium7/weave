export type StreamEvent =
  | { type: "text-delta"; content: string }
  | { type: "text-complete"; content: string }
  | { type: "tool-call"; tool: string; args: Record<string, unknown> }
  | { type: "tool-result"; tool: string; result: Record<string, unknown> }
  | { type: "file-write"; path: string; content: string }
  | { type: "file-delete"; path: string }
  | { type: "command-run"; command: string }
  | { type: "command-output"; stdout: string; stderr: string; exitCode: number }
  | { type: "preview-url"; url: string }
  | { type: "restored-from-backup" }
  | { type: "backup-complete"; version: number }
  | { type: "error"; content: string }
  | { type: "workspace-sync"; files: Record<string, string> }
  | { type: "done" };