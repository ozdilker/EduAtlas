import { escapeHtml } from "../escape";
import { mailTheme } from "../theme";

/**
 * Small uppercase brand badge.
 */
export function renderMailBadge(label: string): string {
  const t = mailTheme;
  const text = escapeHtml(label.trim());
  if (!text) {
    return "";
  }
  return `<p style="margin:0 0 ${t.space[8]}px;font-family:${t.font.family};font-size:${t.font.size.sm}px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${t.color.brandRed};">${text}</p>`;
}
