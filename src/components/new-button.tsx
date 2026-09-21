"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

// Creates a fully pre-populated record via POST, then navigates to its editor.
export function NewButton({
  endpoint,
  basePath,
  label,
}: {
  endpoint: string;
  basePath: string;
  label: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function create() {
    setLoading(true);
    try {
      const res = await fetch(endpoint, { method: "POST" });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const item = await res.json();
      router.push(`${basePath}/${item.id}`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <Button onClick={create} disabled={loading}>
      <Plus className="h-4 w-4" />
      {loading ? "Creating..." : label}
    </Button>
  );
}
