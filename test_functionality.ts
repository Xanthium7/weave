import { runAgentLoop } from "./actions/loop";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(query: string): Promise<string> {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  require("dotenv").config({ path: ".env.local" });
  require("dotenv").config();

  console.log("=== Lovable Terminal ===");
  const projectId = await ask("Project ID: ");

  while (true) {
    const userMessage = await ask("\nYou: ");
    if (userMessage.toLowerCase() === "exit") {
      rl.close();
      process.exit(0);
    }

    console.log("\n[Thinking...]\n");
    await runAgentLoop(projectId, userMessage);
  }
}

main().catch(console.error);
