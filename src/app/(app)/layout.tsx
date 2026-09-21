import Link from "next/link";

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      {children}
    </Link>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-semibold">
              Agile Testing Tool
            </Link>
            <nav className="flex items-center gap-4">
              <NavLink href="/bugs">Bug Tickets</NavLink>
              <NavLink href="/tests">Implementation Tests</NavLink>
              <NavLink href="/dashboard">Dashboard</NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/api/export/bulk"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Bulk export
            </a>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="container py-8">{children}</main>
    </>
  );
}
