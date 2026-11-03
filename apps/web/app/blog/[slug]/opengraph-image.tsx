import { entriesOf, getEntry, SECTIONS } from "../../_content/content";
import { OG_SIZE, OG_TYPE, shareCard } from "../../_content/og";

export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = "debugsy share card with the page's heading";
export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return entriesOf("blog").map((e) => ({ slug: e.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const e = getEntry("blog", (await params).slug);
  return shareCard({
    label: SECTIONS["blog"].label,
    title: e?.h1 ?? SECTIONS["blog"].h1,
    foot: `debugsy.n-uf.com${e?.path ?? SECTIONS["blog"].path}`,
  });
}
