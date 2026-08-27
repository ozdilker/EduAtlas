import { describe, expect, it } from "vitest";
import { resolveCampaignBodyLines } from "./resolve-campaign-body-lines";

describe("resolveCampaignBodyLines", () => {
  it("splits description into paragraphs and falls back to template lines", () => {
    expect(
      resolveCampaignBodyLines({
        description: "Bir\n\n  İki  \n",
        templateBodyLines: ["Şablon"],
      }),
    ).toEqual(["Bir", "İki"]);

    expect(
      resolveCampaignBodyLines({
        description: "   ",
        templateBodyLines: ["Şablon A", "Şablon B"],
      }),
    ).toEqual(["Şablon A", "Şablon B"]);
  });
});
