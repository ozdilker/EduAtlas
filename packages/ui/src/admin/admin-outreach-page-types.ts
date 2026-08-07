import type {
  GrowthCampaignOption,
  GrowthCenterPageProps,
  GrowthFormValues,
  GrowthProgressView,
  GrowthRecipientView,
  GrowthSelectOption,
} from "./growth-center/types";

/** @deprecated Prefer GrowthCenter types; kept for existing imports. */
export type AdminOutreachCampaignOption = GrowthCampaignOption;
export type AdminOutreachSelectOption = GrowthSelectOption;
export type AdminOutreachFormValues = GrowthFormValues;
export type AdminOutreachProgressView = GrowthProgressView;
export type AdminOutreachRecipientView = GrowthRecipientView;
export type AdminOutreachPageProps = GrowthCenterPageProps;
