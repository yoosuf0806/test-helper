import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RunMode } from "@/components/run-mode";

export const dynamic = "force-dynamic";

export default async function TestRunPage({
  params,
}: {
  params: { id: string };
}) {
  const test = await prisma.implementationTest.findUnique({
    where: { id: params.id },
    include: { testCases: true },
  });
  if (!test) notFound();
  return <RunMode test={test} />;
}
