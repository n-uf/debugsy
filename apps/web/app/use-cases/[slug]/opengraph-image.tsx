import { entriesOf, getEntry, SECTIONS } from "../../_content/content";
import { OG_SIZE, OG_TYPE, shareCard } from "../../_content/og";

export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = "debugsy share card with the page's heading";
export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return entriesOf("use-cases").map((e) => ({ slug: e.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const e = getEntry("use-cases", (await params).slug);
  return shareCard({
    label: SECTIONS["use-cases"].label,
    title: e?.h1 ?? SECTIONS["use-cases"].h1,
    foot: `debugsy.n-uf.com${SECTIONS["use-cases"].path}`,
  });
}
