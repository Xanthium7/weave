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
  projectDir: string = "/home/user/LovableProject",
) {
  // Detect if package.json is in a subdirectory - these are there cause modle dumb
  let targetDir = projectDir;
  // try {
  //   const files = await sandbox.files.list(projectDir);
  //   const hasPackageJson = files.some((f) => f.name === "package.json");
  //   if (!hasPackageJson) {
  //     for (const file of files) {
  //       if (file.type === "dir") {
  //         const subFiles = await sandbox.files.list(`${projectDir}/${file.name}`);
  //         if (subFiles.some((sf) => sf.name === "package.json")) {
  //           targetDir = `${projectDir}/${file.name}`;
  //           console.log(`[Bootstrap]: Detected package.json in subdirectory: ${targetDir}`);
  //           break;
  //         }
  //       }
  //     }
  //   }
  // } catch (e) {
  //   console.error("[Bootstrap] Error detecting project structure:", e);
  // }

  try {
    console.log(`[Bootstrap]: Running npm install in ${targetDir}...`);
    const install = await sandbox.commands.run(`cd ${targetDir} && npm install`, {
      timeoutMs: 5 * 60 * 1000, // 5 mins
    });
    if (install.stderr) console.error("[Bootstrap] npm install stderr:", install.stderr);
  } catch (err: any) {
    console.error("[Bootstrap] npm install failed (but proceeding to start server):", err.message);
  }

  // Detect if it is a Next.js or Vite/other project to run the correct host exposing flag
  let isNext = false;
  try {
    const packageJsonStr = await sandbox.files.read(`${targetDir}/package.json`);
    const packageJson = JSON.parse(packageJsonStr);
    isNext = !!(packageJson.dependencies?.next || packageJson.devDependencies?.next);
  } catch (e) {
    console.error("[Bootstrap] Error reading package.json to identify project type:", e);
  }

  console.log(`[Bootstrap]: Starting dev server in ${targetDir}...`);
  try {
    if (isNext) {
      // Next.js uses -H or --hostname to bind host
      await sandbox.commands.run(
        `cd ${targetDir} && npm run dev -- -H 0.0.0.0`,
        { background: true },
      );
    } else {
      // Vite and most others use --host
      await sandbox.commands.run(
        `cd ${targetDir} && npm run dev -- --host 0.0.0.0`,
        { background: true },
      );
    }
  } catch (err: any) {
    console.error("[Bootstrap] Failed to execute npm run dev command:", err.message);
  }

  // dynamically poll port 3000 to wait for the server to be ready (up to 40s) - debuggin
  // console.log(`[Bootstrap]: Waiting for server to start listening on port 3000...`);
  // let isReady = false;
  // for (let i = 0; i < 20; i++) {
  //   try {
  //     const check = await sandbox.commands.run(`curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`, {
  //       timeoutMs: 2000,
  //     });
  //     const httpCode = check.stdout.trim();
  //     if (httpCode !== "000" && httpCode !== "") {
  //       isReady = true;
  //       console.log(`[Bootstrap]: Server is ready! Response code: ${httpCode}`);
  //       break;
  //     }
  //   } catch {}
  //   await new Promise((resolve) => setTimeout(resolve, 2000));
  // }

  // if (!isReady) {
  //   console.log(`[Bootstrap]: Server on port 3000 did not respond within 40s. Proceeding anyway...`);
  // }

  try {
    const host = sandbox.getHost(3000);
    console.log(`[Bootstrap]: Server ready at https://${host}`);
    return `https://${host}`;
  } catch (e) {
    console.error("Error getting host", e);
    return null;
  }
}

export async function syncSandboxFiles(
  sandbox: Sandbox,
  projectDir: string = "/home/user/LovableProject",
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};

  // Recursively read directory
  async function readDir(currentPath: string) {
    try {
      const files = await sandbox.files.list(currentPath);
      for (const file of files) {
        if (
          file.name === "node_modules" ||
          file.name === ".git" ||
          file.name === "dist" ||
          file.name === ".next"
        )
          continue;

        const fullPath = `${currentPath}/${file.name}`.replace(/\/+/g, "/");
        if (file.type === "dir") {
          await readDir(fullPath);
        } else {
          const content = await sandbox.files.read(fullPath);
          const relativePath = fullPath.replace(projectDir, "");
          result[relativePath] = content;
        }
      }
    } catch (e) {
      console.error("Error reading dir", currentPath, e);
    }
  }

  await readDir(projectDir);
  return result;
}
