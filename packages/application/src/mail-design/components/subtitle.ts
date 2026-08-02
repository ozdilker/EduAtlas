import { escapeHtml } from "../escape";
import { mailTheme } from "../theme";

/**
 * Supporting subtitle under the title.
 */
export function renderMailSubtitle(text: string): string {
  const t = mailTheme;
  const trimmed = text.trim();
  if (!trimmed) {
    return "";
  }
  return `<p style="margin:0 0 ${t.space[16]}px;font-family:${t.font.family};font-size:${t.font.size.md}px;line-height:1.5;color:${t.color.textMuted};">${escapeHtml(trimmed)}</p>`;
}
