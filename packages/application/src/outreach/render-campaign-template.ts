import type { CampaignTemplate } from "@eduatlas/domain";
import {
  type RenderedEmail,
  renderEmailTemplate,
} from "../notifications/email-templates";

/**
 * Renders a campaign template preview through EMDS (no send).
 */
export function renderCampaignTemplatePreview(template: CampaignTemplate): RenderedEmail {
  return renderEmailTemplate({
    title: template.subject,
    preview: template.preview,
    bodyLines: template.bodyLines,
  });
}
