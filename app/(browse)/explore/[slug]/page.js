import { notFound } from "next/navigation";
import { exploreItems } from "@/app/lib/exploreItems";
import ContentStepper from "./ContentStepper";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const item = exploreItems.find((it) => it.slug === slug);

  if (!item) {
    return {
      title: "Lesson Not Found",
      description: "We couldn't find this ChessFast lesson. Learn chess quickly with our curated guides.",
    };
  }

  return {
    title: item.title,
    description: item.description ?? "Learn chess quickly with guided lessons from ChessFast.",
  };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const item = exploreItems.find((it) => it.slug === slug);

  if (!item) return notFound();

  return (
    <ContentStepper
      title={item.title}
      content={item.content ?? (item.description ? [item.description] : [])}
    />
  );
}

export async function generateStaticParams() {
  return exploreItems.map((it) => ({ slug: it.slug }));
}

