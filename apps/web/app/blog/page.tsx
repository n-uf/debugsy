import type { Metadata } from "next";
import type React from "react";
import { SectionIndex, sectionMetadata } from "../_components/content/section-index";

export const metadata: Metadata = sectionMetadata("blog");

export default function BlogIndex(): React.ReactElement {
  return <SectionIndex section="blog" />;
}
