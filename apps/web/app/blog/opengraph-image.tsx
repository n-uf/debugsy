import { SECTIONS } from "../_content/content";
import { OG_SIZE, OG_TYPE, shareCard } from "../_content/og";

export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = "debugsy share card: blog";

export default async function Image() {
  const s = SECTIONS["blog"];
  return shareCard({ label: s.label, title: s.h1, foot: `debugsy.n-uf.com${s.path}` });
}
