'use client'

import Link from "next/link";
import { useState } from "react";


function HeaderColor() {
    const [dailyActive, setDailyActive] = useState(true);
    const [exploreActive, setExploreActive] = useState(false);

    function handleDailyClick() {
        setDailyActive(true);
        setExploreActive(false);
    }

    function handleExploreClick() {
        setDailyActive(false);
        setExploreActive(true);
    }
  
  return (
    <>
                <Link href="/daily">
                <button onClick={handleDailyClick} style={{ background: dailyActive ? "#5B21B6" : "black" }} className="w-28 h-10 rounded cursor-pointer xl:text-lg hover:brightness-120 hover:-translate-y-0.5 hover:shadow-lg duration-[200ms]">Daily</button>
                </Link>
                <Link href="/explore">
                <button onClick={handleExploreClick} style={{ background: dailyActive ? "black" : "#5B21B6" }} className="w-28 h-10 rounded cursor-pointer xl:text-lg hover:brightness-120 hover:-translate-y-0.5 hover:shadow-lg duration-[200ms]">Explore</button>
                </Link>
    </>
  )
}

export default HeaderColor