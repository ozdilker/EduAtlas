export const DeliveryJobStatus = Object.freeze({
  Pending: "pending",
  Locked: "locked",
  Sent: "sent",
  Failed: "failed",
  Bounced: "bounced",
  Cancelled: "cancelled",
} as const);

export type DeliveryJobStatus =
  (typeof DeliveryJobStatus)[keyof typeof DeliveryJobStatus];

export function isDeliveryJobStatus(value: string): value is DeliveryJobStatus {
  return Object.values(DeliveryJobStatus).includes(value as DeliveryJobStatus);
}

export function parseDeliveryJobStatus(raw: string): DeliveryJobStatus {
  const value = raw.trim();
  if (!isDeliveryJobStatus(value)) {
    throw new Error(`Unknown DeliveryJobStatus: ${raw}`);
  }
  return value;
}
