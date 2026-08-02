import { escapeHtml } from "../escape";
import { mailTheme } from "../theme";

/**
 * Primary email title (H1).
 */
export function renderMailTitle(text: string): string {
  const t = mailTheme;
  return `<h1 style="margin:0 0 ${t.space[16]}px;font-family:${t.font.family};font-size:${t.font.size.xl}px;line-height:1.3;font-weight:700;color:${t.color.brandNavy};">${escapeHtml(text.trim())}</h1>`;
}
