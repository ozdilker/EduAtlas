import { mailTheme } from "../theme";

/**
 * Horizontal rule / divider.
 */
export function renderMailDivider(): string {
  const t = mailTheme;
  return `<hr style="margin:${t.space[24]}px 0;border:0;border-top:1px solid ${t.color.borderGray};" />`;
}
