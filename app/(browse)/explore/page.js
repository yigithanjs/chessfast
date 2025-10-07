import { Suspense } from "react";
import Footer from "../Footer";
import ExploreClient from "./_components/explore-client";

export const metadata = {
  title: "Explore Lessons",
  description: "Browse the ChessFast library and dive into lessons tailored to your goals.",
};

export default function ExplorePage() {
  return (
    <>
      <Suspense fallback={<div className="w-[90%] ml-auto mr-auto py-8" />}>
        <ExploreClient />
      </Suspense>
      <Footer active="explore" />
    </>
  );
}
