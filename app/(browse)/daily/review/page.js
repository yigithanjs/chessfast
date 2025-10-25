import { Suspense } from "react";
import ReviewPageComp from "./ReviewComp";


export default function reviewPage() {
  return (
    <Suspense fallback={null}>
    <ReviewPageComp />
    </Suspense>
  )
}