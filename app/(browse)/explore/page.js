"use client";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Footer from "../Footer";
import Filtersheet from "@/app/(browse)/explore/_components/filtersheet";
import { exploreItems } from "@/app/lib/exploreItems";
import Link from "next/link";
import clsx from "clsx";

export default function Explore() {
  const searchParams = useSearchParams();
  // read tags from URL like /explore?tags=Openings,Tactics
  const selected = (searchParams.get("tags") || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  // OR filter: show item if it has ANY selected tag; show all if none selected
  const filtered = useMemo(() => {
    if (selected.length === 0) return exploreItems;
    return exploreItems.filter(it => it.tags?.some(t => selected.includes(t)));
  }, [selected]);

  return (
    <>
      <main className="w-[90%] ml-auto mr-auto py-8">
        {/* Filtersheet already updates the URL; this just reads it */}
        <Filtersheet />

        <section className="w-[90%] mx-auto grid grid-cols-1 md:w-[700px] md:mt-20 md:grid-cols-2 lg:grid-cols-3 lg:w-[900px] xl:gap-x-90 xl:gap-y-25 gap-15 mt-10 place-items-center pb-25">
          {filtered.map((item, idx) => (
            <div
              key={item.slug}
              
              className={clsx(
                // if you don't have item.count, use idx instead
                ((item.count ?? idx) % 2 === 0)
                  ? "bg-purple-800 shadow-[4px_4px_0px_#9800c9] "
                  : "bg-pink-700 shadow-[4px_4px_0px_#910d42]",
                "rounded-xl w-70 h-70 xl:w-80 lg:h-75 xl:h-80 grid grid-cols-1"
              )}
              
            >
              <h2 className="text-center font-black text-xl mt-8 px-3">
                {item.title}
              </h2>
              <p className="px-8 text-lg">{item.description}</p>
              <Link href={`/explore/${item.slug}`}
                className={clsx(
                  ((item.count ?? idx) % 2 === 0)
                    ? "bg-purple-900 hover:bg-purple-700 hover:shadow-[3px_3px_0px_#9800c9]"
                    : "bg-pink-800 hover:bg-pink-600 hover:shadow-[3px_3px_0px_#910d42]",
                  "w-40 h-10 rounded text-lg mt-auto mb-5 cursor-pointer hover:-translate-y-0.5 duration-[200ms] ml-auto mr-auto flex items-center justify-center"
                )}
              >
                <button className="cursor-pointer">Jump In</button>
              </Link>
            </div>
          ))}
        </section>
      </main>

      <Footer active="explore" />
    </>
  );
}
