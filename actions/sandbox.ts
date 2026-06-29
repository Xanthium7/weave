"use server";

import prisma from "@/lib/db";
import { extractFilesFromS3 } from "@/lib/s3";

export async function getProjectFiles(projectId: string) {
  // this thing on page load would fetch code from S3
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { s3BackupKey: true },
  });

  if (!project?.s3BackupKey) {
    return {};
  }

  return await extractFilesFromS3(projectId);
}
