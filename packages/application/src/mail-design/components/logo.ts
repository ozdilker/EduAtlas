import { escapeHtml } from "../escape";
import { mailTheme } from "../theme";

/**
 * Text EduAtlas wordmark for email headers (no image).
 */
export function renderMailLogo(): string {
  const t = mailTheme;
  return `<p style="margin:0;font-family:${t.font.family};font-size:${t.font.size.lg}px;font-weight:700;line-height:1.2;color:${t.color.brandNavy};letter-spacing:-0.02em;">Edu<span style="color:${t.color.brandRed};">Atlas</span></p>`;
}
