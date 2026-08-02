import type {
  Campaign,
  CampaignChannel,
  CampaignRecipient,
  DeliveryJob,
} from "@eduatlas/domain";

export type DeliverySendResult = Readonly<{
  readonly outcome: "accepted" | "hard_bounce" | "transient_failure";
  readonly smtpMessageId?: string;
  readonly smtpResponse?: string;
  readonly smtpCode?: string;
  readonly errorMessage?: string;
}>;

export interface DeliveryChannelHandler {
  readonly channel: CampaignChannel;
  send(input: {
    job: DeliveryJob;
    recipient: CampaignRecipient;
    campaign: Campaign;
    now: string;
  }): Promise<DeliverySendResult>;
}
