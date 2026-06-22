// app/projects/[projectId]/page.tsx
"use client";

import { useParams } from "next/navigation";

export default function Project() {

  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  return (
    <div>
      <h1>Project ID: {projectId}</h1>
    </div>
  );
}
