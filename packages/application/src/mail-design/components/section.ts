import { mailTheme } from "../theme";

/**
 * Vertical section spacing wrapper.
 */
export function renderMailSection(innerHtml: string): string {
  const t = mailTheme;
  return `<div style="margin:0 0 ${t.space[16]}px;font-family:${t.font.family};">${innerHtml}</div>`;
}
