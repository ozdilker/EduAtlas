import { CategoryIndexPage } from "@eduatlas/ui";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kurum tipleri",
  description: "Anaokulundan dershaneye kurum türlerine göre keşfedin.",
};

export default function CategoriesIndexRoute() {
  return <CategoryIndexPage />;
}
