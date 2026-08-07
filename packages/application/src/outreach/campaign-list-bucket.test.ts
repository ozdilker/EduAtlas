import { CampaignStatus } from "@eduatlas/domain";
import { describe, expect, it } from "vitest";
import {
  CampaignListBucket,
  CampaignListFilter,
  campaignListBucketLabel,
  campaignMatchesListFilter,
  resolveCampaignListBucket,
} from "./campaign-list-bucket";

describe("resolveCampaignListBucket", () => {
  it("maps draft without recipients to Taslak", () => {
    expect(resolveCampaignListBucket(CampaignStatus.Draft, 0)).toBe(CampaignListBucket.Draft);
    expect(campaignListBucketLabel(CampaignListBucket.Draft)).toBe("Taslak");
  });

  it("maps draft with recipients to Hazırlandı without changing domain status", () => {
    expect(resolveCampaignListBucket(CampaignStatus.Draft, 5)).toBe(
      CampaignListBucket.Prepared,
    );
    expect(campaignListBucketLabel(CampaignListBucket.Prepared)).toBe("Hazırlandı");
  });

  it("maps ready / running / paused / terminal states", () => {
    expect(resolveCampaignListBucket(CampaignStatus.Ready, 10)).toBe(CampaignListBucket.Ready);
    expect(resolveCampaignListBucket(CampaignStatus.Running, 10)).toBe(
      CampaignListBucket.Running,
    );
    expect(resolveCampaignListBucket(CampaignStatus.Paused, 10)).toBe(
      CampaignListBucket.Running,
    );
    expect(resolveCampaignListBucket(CampaignStatus.Completed, 10)).toBe(
      CampaignListBucket.Completed,
    );
    expect(resolveCampaignListBucket(CampaignStatus.Cancelled, 10)).toBe(
      CampaignListBucket.Cancelled,
    );
    expect(resolveCampaignListBucket(CampaignStatus.Failed, 10)).toBe(
      CampaignListBucket.Failed,
    );
  });
});

describe("campaignMatchesListFilter", () => {
  it("treats archive as completed|cancelled|failed UI filter", () => {
    expect(
      campaignMatchesListFilter(CampaignListFilter.Archive, CampaignStatus.Completed, 1),
    ).toBe(true);
    expect(
      campaignMatchesListFilter(CampaignListFilter.Archive, CampaignStatus.Cancelled, 1),
    ).toBe(true);
    expect(
      campaignMatchesListFilter(CampaignListFilter.Archive, CampaignStatus.Failed, 1),
    ).toBe(true);
    expect(
      campaignMatchesListFilter(CampaignListFilter.Archive, CampaignStatus.Draft, 1),
    ).toBe(false);
  });

  it("separates draft vs prepared by recipient count", () => {
    expect(campaignMatchesListFilter(CampaignListFilter.Draft, CampaignStatus.Draft, 0)).toBe(
      true,
    );
    expect(campaignMatchesListFilter(CampaignListFilter.Draft, CampaignStatus.Draft, 2)).toBe(
      false,
    );
    expect(
      campaignMatchesListFilter(CampaignListFilter.Prepared, CampaignStatus.Draft, 2),
    ).toBe(true);
  });
});
