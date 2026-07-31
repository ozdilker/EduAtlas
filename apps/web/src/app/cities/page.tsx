import { CityIndexPage } from "@eduatlas/ui";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Şehirler",
  description: "Türkiye’de eğitim kurumlarını şehir bazında keşfedin.",
};

export default function CitiesIndexRoute() {
  return <CityIndexPage />;
}
