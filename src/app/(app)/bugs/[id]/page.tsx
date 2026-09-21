import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BugForm } from "@/components/bug-form";

export const dynamic = "force-dynamic";

export default async function BugEditPage({
  params,
}: {
  params: { id: string };
}) {
  const bug = await prisma.bugTicket.findUnique({ where: { id: params.id } });
  if (!bug) notFound();
  return <BugForm initial={bug} />;
}
