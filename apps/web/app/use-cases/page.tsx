import type { Metadata } from "next";
import type React from "react";
import { SectionIndex, sectionMetadata } from "../_components/content/section-index";

export const metadata: Metadata = sectionMetadata("use-cases");

export default function UseCasesIndex(): React.ReactElement {
  return <SectionIndex section="use-cases" />;
}
