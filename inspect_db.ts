
import prisma from "./lib/db";

async function main() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    take: 1
  });

  if (projects.length === 0) {
    console.log("No projects found.");
    return;
  }

  const project = projects[0];
  console.log(`=== Project: ${project.name} (${project.id}) ===`);
  console.log(`Initial Prompt: ${project.initialPrompt}`);
  console.log(`S3 Backup Key: ${project.s3BackupKey}`);
  console.log(`Last Backup: ${project.lastBackupAt}`);
  console.log("\n--- Context History ---");
  
  const context = project.context as any[];
  if (!context || context.length === 0) {
    console.log("No history found.");
    return;
  }

  context.forEach((msg, idx) => {
    console.log(`\n[Message #${idx}] Role: ${msg.role}`);
    if (msg.parts) {
      msg.parts.forEach((part: any, pIdx: number) => {
        if (part.text) {
          console.log(`  Part #${pIdx} (Text):\n${part.text.substring(0, 500)}${part.text.length > 500 ? '...' : ''}`);
        }
        if (part.functionCall) {
          console.log(`  Part #${pIdx} (Function Call): ${part.functionCall.name} with args:`, part.functionCall.args);
        }
        if (part.functionResponse) {
          console.log(`  Part #${pIdx} (Function Response) for ${part.functionResponse.name}:`, part.functionResponse.response);
        }
      });
    }
  });
}

main().catch(console.error);
