export type CampaignTemplate = Readonly<{
  readonly id: string;
  readonly name: string;
  readonly subject: string;
  readonly preview: string;
  /** Plain body paragraphs — HTML is produced only via EMDS. */
  readonly bodyLines: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
}>;

export type CreateCampaignTemplateInput = {
  id: string;
  name: string;
  subject: string;
  preview: string;
  bodyLines: readonly string[];
  createdAt: string;
  updatedAt: string;
};

/**
 * Creates a campaign content template (no HTML storage).
 */
export function createCampaignTemplate(input: CreateCampaignTemplateInput): CampaignTemplate {
  const id = input.id.trim();
  const name = input.name.trim();
  const subject = input.subject.trim();
  const preview = input.preview.trim();
  const bodyLines = Object.freeze(
    input.bodyLines.map((line) => line.trim()).filter(Boolean),
  );

  if (!id) throw new Error("CampaignTemplate.id is required.");
  if (!name) throw new Error("CampaignTemplate.name is required.");
  if (!subject) throw new Error("CampaignTemplate.subject is required.");
  if (!preview) throw new Error("CampaignTemplate.preview is required.");
  if (bodyLines.length === 0) throw new Error("CampaignTemplate.bodyLines must not be empty.");
  assertIso(input.createdAt, "createdAt");
  assertIso(input.updatedAt, "updatedAt");

  return Object.freeze({
    id,
    name,
    subject,
    preview,
    bodyLines,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  });
}

function assertIso(value: string, field: string): void {
  if (Number.isNaN(Date.parse(value))) {
    throw new Error(`CampaignTemplate.${field} must be a valid ISO timestamp.`);
  }
}
