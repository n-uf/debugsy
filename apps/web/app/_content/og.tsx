import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

/** Share cards: 1200 × 630 PNG, drawn at build time in the site's ocean colours. */
export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_TYPE = "image/png";

const font = (pkg: string, file: string): Promise<Buffer> =>
  readFile(path.join(process.cwd(), "node_modules", "@fontsource", pkg, "files", file));

// Keep product names on one line: a no-break space inside them.
const KEEP_TOGETHER = ["React DevTools", "React Scan", "why-did-you-render", "Minified React error"];
const keep = (s: string): string =>
  KEEP_TOGETHER.reduce((acc, name) => acc.split(name).join(name.replace(/ /g, " ")), s);

export async function shareCard({
  label,
  title,
  foot,
}: {
  readonly label: string;
  readonly title: string;
  readonly foot: string;
}): Promise<ImageResponse> {
  const [inter600, mono400, mono600] = await Promise.all([
    font("inter", "inter-latin-600-normal.woff"),
    font("jetbrains-mono", "jetbrains-mono-latin-400-normal.woff"),
    font("jetbrains-mono", "jetbrains-mono-latin-600-normal.woff"),
  ]);
  const size = title.length > 70 ? 54 : title.length > 48 ? 62 : 70;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#e2e8f0",
        color: "#1e293b",
        fontFamily: "JetBrains Mono",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", flex: 1, padding: "64px 72px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span style={{ fontSize: 38, fontWeight: 600, letterSpacing: -0.5 }}>debugsy</span>
          <div style={{ display: "flex", gap: 6 }}>
            {["#60a5fa", "#34d399", "#fbbf24", "#f87171", "#a78bfa"].map((c) => (
              <div key={c} style={{ width: 28, height: 14, borderRadius: 3, background: c }} />
            ))}
          </div>
        </div>
        <div
          style={{
            marginTop: 54,
            fontSize: 20,
            fontWeight: 600,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#475569",
          }}
        >
          {label}
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: "Inter",
            fontSize: size,
            fontWeight: 600,
            lineHeight: 1.12,
            letterSpacing: -1,
            maxWidth: 1040,
          }}
        >
          {keep(title)}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          height: 92,
          padding: "0 72px",
          background: "#0f172a",
          color: "#cbd5e1",
          fontSize: 24,
        }}
      >
        <span>{foot}</span>
        <span style={{ color: "#64748b" }}>by n-uf</span>
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        { name: "Inter", data: inter600, weight: 600, style: "normal" },
        { name: "JetBrains Mono", data: mono400, weight: 400, style: "normal" },
        { name: "JetBrains Mono", data: mono600, weight: 600, style: "normal" },
      ],
    },
  );
}
