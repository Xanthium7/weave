// app/projects/[projectId]/page.tsx
"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams } from "next/navigation";


export default function Project() {

  const params = useParams<{ projectId: string }>();
  const session = useSession()

  if (!session.data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-8">
        <h1 className="text-2xl text-neutral-900 dark:text-neutral-50 font-medium tracking-tight">Yeah walk yo ass back and login..</h1>
        <Link className="text-2xl border px-8 py-3 rounded-full bg-neutral-900 text-neutral-50 font-medium tracking-tight" href="/auth/signin">Login</Link>
      </div>
    )
  }

  const projectId = params.projectId;
  return (
    <div>
      <h1>Project ID: {projectId}</h1>
    </div>
  );
}
