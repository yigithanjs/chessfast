"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function HeaderColor() {
  const pathname = usePathname();
  const isDaily = pathname === "/daily" || pathname === "/daily/";
  const isExplore = pathname.startsWith("/explore");

  return (
    <>
      <Link href="/daily">
        <button
          className="w-28 h-10 rounded cursor-pointer xl:text-lg hover:brightness-120 hover:-translate-y-0.5 hover:shadow-lg duration-200"
          style={{ background: isDaily ? "#5B21B6" : "#0b0b0b" }}
        >
          Daily
        </button>
      </Link>

      <Link href="/explore">
        <button
          className="w-28 h-10 rounded cursor-pointer xl:text-lg hover:brightness-120 hover:-translate-y-0.5 hover:shadow-lg duration-200"
          style={{ background: isExplore ? "#5B21B6" : "#0b0b0b" }}
        >
          Explore
        </button>
      </Link>
    </>
  );
}