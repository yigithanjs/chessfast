import Link from "next/link";

export default function FooterBase({ active }) {
  const base = "h-12 flex items-center justify-center font-bold text-white";
  return (
    <footer className="fixed bottom-0 w-full md:hidden">
      <nav className="grid grid-cols-2 text-center">
        <Link
          href="/daily"
          className={`${base} ${active === "daily" ? "bg-purple-900" : "bg-zinc-900"}`}
        >
          Daily
        </Link>
        <Link
          href="/explore"
          className={`${base} ${active === "explore" ? "bg-purple-900" : "bg-zinc-900"}`}
        >
          Explore
        </Link>
      </nav>
    </footer>
  );
}