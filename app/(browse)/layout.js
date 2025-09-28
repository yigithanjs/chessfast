import { Analytics } from "@vercel/analytics/next"
import Link from "next/link";

export default function BrowseLayout({ children }) {
  return (
        <>
            <header id="browse-header" className="bg-[#151515] w-[90%] lg:w-[950px] xl:w-[1150px] 2xl:w-[1300px] ml-auto mr-auto mt-8 py-5 rounded-lg drop-shadow-lg shadow-[6px_6px_1px_0_rgba(0,0,0,0.25)] xl:shadow-[8px_8px_1px_0_rgba(0,0,0,0.25)] md:flex items-center justify-between">
                <div className="ml-5 md:ml-8">
                    <Link href="/daily">
                    <h1 className="font-bold text-xl xl:text-2xl">CHESSFAST</h1>
                    <p className="opacity-50 xl:text-lg">your daily chess candy</p>
                    </Link>
                </div>

            <nav className="hidden md:flex mr-5 md:mr-8 gap-5">
                <Link href="/daily">
                <button className="bg-violet-800 w-28 h-10 rounded cursor-pointer xl:text-lg hover:brightness-120 hover:-translate-y-0.5 hover:shadow-lg duration-[200ms]">Daily</button>
                </Link>
                <Link href="/explore">
                <button className="bg-pink-700 w-28 h-10 rounded cursor-pointer xl:text-lg hover:brightness-120 hover:-translate-y-0.5 hover:shadow-lg duration-[200ms]">Explore</button>
                </Link>
            </nav>
            </header>
            <main>{children}</main>
            <Analytics />
        </>
  );
}
