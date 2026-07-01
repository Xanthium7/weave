import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import Sandbox from "@e2b/code-interpreter";
import { Readable } from "stream";
import { createGunzip } from "zlib";
import * as tar from "tar";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.S3_BUCKET_NAME!;

const PROJECT_DIR = "/home/user/LovableProject";

export const backupToS3 = async (
  sandbox: Sandbox,
  projectId: string,
  s3BackupKey?: string,
) => {
  let currentVersion = 0;
  if (s3BackupKey) {
    const match = s3BackupKey.match(/\/v(\d+)\.tar\.gz$/);
    if (match) {
      currentVersion = parseInt(match[1], 10);
    }
  } else {
    currentVersion = await getLatestVersion(projectId);
  }
  const nextVersion = currentVersion + 1;

  const check = await sandbox.commands.run(
    `test -d ${PROJECT_DIR} && echo "exists" || echo "missing"`,
    { timeoutMs: 5000 },
  );

  if (check.stdout.trim() !== "exists") {
    throw new Error("Project directory not found in Sandbox");
  }
  const tarResult = await sandbox.commands.run(
    `tar -czf /tmp/backup.tar.gz -C ${PROJECT_DIR} --exclude=node_modules --exclude=.next --exclude=dist .`,
    { timeoutMs: 30000 },
  );
  if (tarResult.exitCode !== 0) {
    throw new Error(
      `Tar archiving failed with exit code ${tarResult.exitCode}: ${tarResult.stderr}`,
    );
  }

  const tarBytes = await sandbox.files.read("/tmp/backup.tar.gz", {
    format: "bytes",
  });

  const key = `projects/${projectId}/v${nextVersion}.tar.gz`;
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: Buffer.from(tarBytes),
      ContentType: "application/gzip",
      Metadata: {
        projectId,
        version: String(nextVersion),
        timestamp: Date.now().toString(),
      },
    }),
  );

  await sandbox.commands.run("rm -f /tmp/backup.tar.gz");
  console.log(`[S3] Backup ${projectId} -> ${key}`);
  return nextVersion;
};

export const restoreIntoSandbox = async (
  sandbox: Sandbox,
  projectId: string,
) => {
  const latestVersion = await getLatestVersion(projectId);
  if (latestVersion === 0) return false;
  const key = `projects/${projectId}/v${latestVersion}.tar.gz`;

  const response = await s3.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
  );

  const bodyBytes = await response.Body!.transformToByteArray();
  await sandbox.files.write(
    "/tmp/backup.tar.gz",
    bodyBytes.buffer as ArrayBuffer,
  );
  await sandbox.commands.run(`mkdir -p ${PROJECT_DIR}`);
  const tarResult = await sandbox.commands.run(
    `tar -xzf /tmp/backup.tar.gz -C ${PROJECT_DIR}`,
    {
      timeoutMs: 30000,
    },
  );
  if (tarResult.exitCode !== 0) {
    throw new Error(
      `Tar extraction failed with exit code ${tarResult.exitCode}: ${tarResult.stderr}`,
    );
  }

  await sandbox.commands.run("rm -f /tmp/backup.tar.gz");

  console.log(`[S3] Restored: ${projectId} from ${key}`);
  return true;
};

export async function extractFilesFromS3(
  projectId: string,
): Promise<Record<string, string>> {
  const latestVersion = await getLatestVersion(projectId);
  if (latestVersion === 0) return {};

  const key = `projects/${projectId}/v${latestVersion}.tar.gz`;

  const response = await s3.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
  );

  const files: Record<string, string> = {};
  const bodyStream = response.Body as Readable;

  await new Promise<void>((resolve, reject) => {
    const extract = new tar.Parser();
    extract.on("entry", (entry: tar.ReadEntry) => {
      if (entry.type !== "File") {
        entry.resume();
        return;
      }

      const chunks: Buffer[] = [];
      entry.on("data", (chunk: Buffer) => chunks.push(chunk));
      entry.on("end", () => {
        const content = Buffer.concat(chunks).toString("utf-8");
        const filePath = "/" + entry.path.replace(/^\.\//, "");
        files[filePath] = content;
      });
    });

    const gunzip = createGunzip();

    bodyStream
      .pipe(gunzip)
      .pipe(extract)
      .on("end", resolve)
      .on("error", reject);
  });

  console.log(
    `[S3] Extracted ${Object.keys(files).length} files for ${projectId}`,
  );
  return files;
}

// util funcs

export async function getLatestVersion(projectId: string): Promise<number> {
  const prefix = `projects/${projectId}/`;
  const response = await s3.send(
    new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix }),
  );

  if (!response.Contents || response.Contents.length === 0) return 0;

  let maxVersion = 0;
  for (const obj of response.Contents) {
    const match = obj.Key?.match(/\/v(\d+)\.tar\.gz$/);
    if (match) {
      const v = parseInt(match[1], 10);
      if (v > maxVersion) maxVersion = v;
    }
  }
  return maxVersion;
}

export async function listVersions(projectId: string) {
  const prefix = `projects/${projectId}/`;
  const response = await s3.send(
    new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix }),
  );

  if (!response.Contents) return [];

  return response.Contents.filter((obj) => obj.Key?.match(/\/v\d+\.tar\.gz$/))
    .map((obj) => {
      const match = obj.Key!.match(/\/v(\d+)\.tar\.gz$/);
      return {
        version: parseInt(match![1], 10),
        key: obj.Key!,
        lastModified: obj.LastModified!,
      };
    })
    .sort((a, b) => b.version - a.version);
}

// this would look somehting liket this
// [
//   {
//     "version": 3,
//     "key": "projects/my-project-id/v3.tar.gz",
//     "lastModified": "2026-06-28T23:10:00.000Z"
//   },
//   {
//     "version": 2,
//     "key": "projects/my-project-id/v2.tar.gz",
//     "lastModified": "2026-06-28T19:30:00.000Z"
//   },
//   {
//     "version": 1,
//     "key": "projects/my-project-id/v1.tar.gz",
//     "lastModified": "2026-06-28T15:00:00.000Z"
//   }
// ]
