import { notFound } from "next/navigation";
import { exploreItems } from "@/app/lib/exploreItems";
import ContentStepper from "./ContentStepper";

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

