import Sandbox from "@e2b/code-interpreter";

export async function createSandbox() {
  return await Sandbox.create({
    apiKey: process.env.E2B_API_KEY!,
    timeoutMs: 10 * 60 * 1000, // 10 mins
  });
}

// to restore code, install deps, and strat dev server - gives the preview url 
export async function bootstrapProject(
  sandbox: Sandbox,
  projectDir: string = "home/user/LovableProject",
) {
  await sandbox.commands.run(`cd ${projectDir} && npm install `, {
    timeoutMs: 5 * 60 * 1000, // 5 mins
  });

  await sandbox.commands.run(
    `cd ${projectDir} && npm run dev -- --host 0.0.0.0`,
    {
      background: true,
    },
  );

  // give server time to start
  await new Promise((resolve) => setTimeout(resolve, 4000));

  try {
    const host = sandbox.getHost(3000);
    return `https://${host}`;
  } catch (e) {
    console.error("Error getting host", e);
    return null;
  }
}
