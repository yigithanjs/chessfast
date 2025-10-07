import { redirect } from "next/navigation";

export const metadata = {
  title: "ChessFast",
  description: "Learn chess quickly with daily lessons and curated training paths.",
};

export default function Home() {
  redirect("/daily");
}


