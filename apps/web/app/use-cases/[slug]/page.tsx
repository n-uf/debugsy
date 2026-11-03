import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type React from "react";
import { entriesOf, getEntry } from "../../_content/content";
import { EntryPage, entryMetadata } from "../../_components/content/entry-page";

export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return entriesOf("use-cases").map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const e = getEntry("use-cases", (await params).slug);
  return e ? entryMetadata(e) : {};
}

export default async function UseCasesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  const e = getEntry("use-cases", (await params).slug);
  if (!e) notFound();
  return <EntryPage entry={e} />;
}
