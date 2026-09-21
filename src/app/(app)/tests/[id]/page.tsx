import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TestForm } from "@/components/test-form";

export const dynamic = "force-dynamic";

export default async function TestEditPage({
  params,
}: {
  params: { id: string };
}) {
  const test = await prisma.implementationTest.findUnique({
    where: { id: params.id },
    include: { testCases: true },
  });
  if (!test) notFound();
  return <TestForm initial={test} />;
}
