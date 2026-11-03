import type { Viewport } from "next";
import type React from "react";
import { ContentLayout, CONTENT_VIEWPORT } from "../_components/content/content-layout";

export const viewport: Viewport = CONTENT_VIEWPORT;

export default function SectionLayout({
  children,
}: Readonly<{ children: React.ReactNode }>): React.ReactElement {
  return <ContentLayout>{children}</ContentLayout>;
}
