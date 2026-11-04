import { OG_SIZE, OG_TYPE, shareCard } from "./_content/og";

export const size = OG_SIZE;
export const contentType = OG_TYPE;
export const alt = "debugsy: a React debug panel that runs inside your app";

export default async function Image() {
  return shareCard({
    label: "in-process React debug panel",
    title: "A React debug panel that runs inside your app",
    foot: "debugsy.n-uf.com",
  });
}
