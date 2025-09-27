import { Suspense } from "react";
import Footer from "../Footer";
import ExploreClient from "./_components/explore-client";

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
